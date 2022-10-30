import * as cheerio from 'cheerio';
import { ParseAudioBook, ParseAudioBookSeries, ParseAudioBookCategory, ParseSeries } from './model';
import * as timespan from 'timespan-parser';
import * as moment from 'moment';
import { APILogger } from '../../logger/api.logger';
import { delay } from '../../util/Async.util';

const logger = new APILogger('AudibleParser');

export const parseBook = (htmlDom: string): ParseAudioBook => {
  logger.debug('Parsing book');
  let $ = cheerio.load(htmlDom, null, false);

  let title = $('h1.bc-heading').first().text();
  if (!title || title.length === 0) {
    title = $("meta[property='og:title']").attr('content').trim();
  }

  let subtitle = $('h1.bc-heading').parent().next().text().trim();
  if (!subtitle || subtitle.trim() === '') {
    subtitle = null;
  }

  let jsonData = htmlDom.match('"datePublished":\\s+"([^"]+)')[1].trim();
  let released = 0;
  if (jsonData) {
    released = Math.floor(new Date(jsonData).getTime() / 1000);
  }

  let link = $("link[rel='canonical']").attr('href');
  let amazon_id = link?.split('/')?.pop();

  let authors = [];
  $('.authorLabel a').each((i, elem) => {
    let link = 'https://www.audible.com' + $(elem).attr('href')?.split('?')[0];
    authors.push({
      name: $(elem).text(),
      link: link,
      asin: link.split('/')?.pop(),
    });
  });
  let narrators = [];
  $('.narratorLabel a').each((i, elem) => {
    narrators.push($(elem).text().trim());
  });

  let runtimeSeconds = 0;
  let durationDom = htmlDom.match('"duration":\\s+"([^"]+)');
  if (durationDom && durationDom.length > 1) {
    jsonData = durationDom[1].trim();
    runtimeSeconds = Math.floor(moment.duration(jsonData).asMilliseconds() / 1000);
  } else {
    logger.debug('Did not find ISO time duration, trying to parse from text');
    let runtime = $('li.runtimeLabel').text().split(':')[1].replace('hrs', 'h').replace('mins', 'm').replace('and', '').trim();
    runtimeSeconds = timespan.parse(runtime);
  }

  let summary = '';

  $('.productPublisherSummary p').each((i, elem) => {
    summary += $(elem).text() + '\n';
  });
  summary = summary.trim();

  let parentDom = $('li.seriesLabel');
  let bookNumbersTryGet = parentDom
    .contents()
    .filter((i, elem) => elem.type === 'text' && elem.nodeValue.toLowerCase().includes('book'))
    .map((i, elem) => elem as any)
    .get();
  let seriesDom = parentDom.find('a');
  let seriesResult: ParseAudioBookSeries[] = [];
  if (seriesDom.length > 0) {
    seriesDom.each((i, elem) => {
      logger.debug('Found series: ' + $(elem).text());
      let bookNumber = null;
      let dom = $(elem);
      let seriesLink = 'https://www.audible.com' + dom.attr('href').split('?')[0];
      let seriesName = dom.text();
      let seriesId = seriesLink?.split('/')?.pop();

      if (bookNumbersTryGet.length > 0 && bookNumbersTryGet[i]) {
        let bookText = bookNumbersTryGet[i].nodeValue.toLowerCase() as string;
        bookNumber = bookText.slice(bookText.indexOf('book') + 'book'.length).trim();
        if (bookNumber.endsWith(',')) {
          bookNumber = bookNumber.slice(0, bookNumber.length - 1);
        }
      }

      seriesResult.push({
        name: seriesName,
        link: seriesLink,
        asin: seriesId,
        bookNumber: bookNumber,
      });
    });
  }

  let categoryDom = $('li.categoriesLabel a');

  let categories: ParseAudioBookCategory[] = [];
  if (categoryDom.length > 0) {
    categoryDom.each((i, elem) => {
      let dom = $(elem);
      let categoryLink = 'https://www.audible.com' + dom.attr('href')?.split('?')[0];
      let categoryName = dom.text();
      let categoryId = categoryLink?.split('/')?.pop();
      categories.push({
        name: categoryName,
        link: categoryLink,
        id: categoryId,
      });
    });
  }

  let tags: string[] = [];
  $('.product-topic-tags span.bc-chip-text').each((i, elem) => {
    tags.push($(elem).text().trim());
  });

  let image = $('.hero-content img.bc-pub-block').attr('src');
  if (!image || image.length === 0) {
    let imageDom = htmlDom.match('"image":\\s+"([^"]+)');
    if (imageDom && imageDom.length > 1) {
      image = imageDom[1].trim();
    }
  }

  return {
    asin: amazon_id,
    link: link,
    title: title,
    image: image,
    released: released,
    subtitle: subtitle,
    authors: authors,
    narrators: narrators,
    runtime: runtimeSeconds,
    summary: summary,
    series: seriesResult,
    categories: categories,
    tags: tags,
  };
};

export const parseSeries = (htmlDom: string): ParseSeries => {
  let bookListUrls = [];
  const $ = cheerio.load(htmlDom, null, false);

  let name = $('h1.bc-heading').first().text().trim();
  let summary = $('.bc-expander-content').text().trim();
  let link = $("link[rel='canonical']").attr('href');

  $('li.productListItem').each((i, elem) => {
    let dom = $(elem);
    if (dom.text().includes('Not available on audible.com')) {
      logger.warn('Book is not available on audible.com, skipping');
      return;
    }
    let urlElement = dom.find('h3 a').attr('href')?.split('?')[0];
    if (!urlElement) {
      logger.warn('Could not find book url in series page, book may be unavalible skipping');
      return;
    }
    let url = 'https://www.audible.com' + urlElement;

    let text = dom.find('h2.bc-heading').first().text().trim();
    let bookNumber = null;
    if (text && text.length > 0 && text.toLowerCase().includes('book')) {
      bookNumber = text.slice(text.indexOf('book') + 'book'.length + 1).trim();
    }

    let title = dom.find('h3').text().trim();
    logger.info('Title: ' + title);
    if (!title || title.length === 0) {
      title = 'Unknown title';
    }

    let runtimeSeconds = null;
    text = dom.find('.runtimeLabel').text().trim();
    if (text && text.length > 0 && text.includes('Length:')) {
      try {
        text = text.slice(text.indexOf('Length:') + 'Length:'.length + 1).trim();
        let runtime = text.replace('hrs', 'h').replace('mins', 'm').replace('and', '').trim();
        runtimeSeconds = timespan.parse(runtime);
      } catch (e) {
        logger.error('Failed to parse runtime: ' + dom.find('.runtimeLabel').text().trim());
      }
    }

    let releaseDate = null;
    text = dom.find('.releaseDateLabel').text().trim();
    if (text && text.length > 0 && text.includes('date:')) {
      text = text.slice(text.indexOf('date:') + 'date:'.length + 1).trim();
      releaseDate = Math.floor(new Date(text).getTime() / 1000);
    }

    bookListUrls.push({
      link: url,
      asin: url.split('?')[0].split('/')?.pop(),
      bookNumber: bookNumber,
      runtime: runtimeSeconds,
      releaseDate: releaseDate,
      title: title,
    });
  });

  let asin = $("input[name='asin']").attr('value');

  return {
    link: link,
    name: name,
    summary: summary,
    asin: asin,
    books: bookListUrls,
  };
};

export const getAsin = (url: string): string => {
  return url.split('?')[0]?.split('/')?.pop();
};
