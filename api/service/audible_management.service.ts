import { APILogger } from "../logger/api.logger";
import { AudibleService } from "./audible.service";
import ParseSeries from "../models/parsed_series.model";
import * as timespan from "timespan-parser";
import * as moment from "moment";
import * as cheerio from "cheerio";
import axios from "axios";
import StorageService from "./storage.service";
import ParseAudioBook, { ParseAudioBookSeries, ParseAudioBookCategory } from "../models/parsed_audiobook.model";
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from "../models/audiblebook.model";

export class AudibleManagementService {
  public logger: APILogger;
  public audibleService: AudibleService;

  constructor() {
    this.logger = new APILogger();
    this.audibleService = new AudibleService();
  }

  async downloadBook(url: string): Promise<void> {
    console.log("Downloading book", url);
    let bookId = url.split("?")[0]?.split("/")?.pop();
    if (!bookId) {
      throw new Error("Failed to parse book id");
    }

    let bookObj = await this.audibleService.getBookASIN(bookId);
    if (bookObj !== null) {
      this.logger.debug("Book already exists in database");
      return;
    }

    let html = await this.downloadHtml(url);
    if (!html || html.length < 100) {
      throw new Error("Failed to download book html");
    }
    let book = this.parseBook(html);
    console.log(book);
    return;

    let newBook = await this.audibleService.saveBook({
      asin: book.amazon_id,
      link: book.link,
      title: book.title,
      length: book.runtime,
      released: new Date(book.released),
      summary: book.summary,
      series: book.series.map((s): AudibleSeriesBook => {
        return {
          asin: s.id,
          link: s.link,
          name: s.name,
          bookNumber: s.bookNumber,
        };
      }),
      authors: book.authors.map((a): AudibleAuthor => {
        return {
          asin: a.asin,
          link: a.link,
          name: a.name,
        };
      }),
      tags: book.tags,
      narrators: book.narrators.map((n): AudibleNarrator => {
        return {
          name: n,
        };
      }),
      categories: book.categories.map((c): AudibleCategory => {
        return {
          name: c.name,
          link: c.link,
        };
      }),
    });
  }

  async downloadSeries(url: string): Promise<void> {
    console.log("Downloading series", url);
  }

  parseBook(htmlDom: string): ParseAudioBook {
    const $ = cheerio.load(htmlDom, null, false);
    let title = $("h1.bc-heading").first().text();
    let subtitle = $("h1.bc-heading").parent().next().text().trim();
    if (!subtitle || subtitle.trim() === "") {
      subtitle = null;
    }

    let jsonData = htmlDom.match('"datePublished":\\s+"([^"]+)')[1].trim();
    let released = 0;
    if (jsonData) {
      released = Math.floor(new Date(jsonData).getTime() / 1000);
    }

    let link = $("link[rel='canonical']").attr("href");
    let amazon_id = link?.split("/")?.pop();

    let authors = [];
    $(".authorLabel a").each((i, elem) => {
      let link = "https://www.audible.com" + $(elem).attr("href")?.split("?")[0];
      authors.push({
        name: $(elem).text(),
        link: link,
        asin: link.split("/")?.pop(),
      });
    });
    let narrators = [];
    $(".narratorLabel a").each((i, elem) => {
      narrators.push($(elem).text().trim());
    });

    let runtimeSeconds = 0;
    let durationDom = htmlDom.match('"duration":\\s+"([^"]+)');
    if (durationDom && durationDom.length > 1) {
      jsonData = durationDom[1].trim();
      runtimeSeconds = Math.floor(moment.duration(jsonData).asMilliseconds() / 1000);
    } else {
      this.logger.debug("Did not find ISO time duration, trying to parse from text");
      let runtime = $("li.runtimeLabel").text().split(":")[1].replace("hrs", "h").replace("mins", "m").replace("and", "").trim();
      runtimeSeconds = timespan.parse(runtime);
    }

    let summary = "";

    $(".productPublisherSummary p").each((i, elem) => {
      summary += $(elem).text() + "\n";
    });
    summary = summary.trim();

    let parentDom = $("li.seriesLabel");
    let bookNumbersTryGet = parentDom
      .contents()
      .filter((i, elem) => elem.type === "text" && elem.nodeValue.toLowerCase().includes("book"))
      .map((i, elem) => elem as any)
      .get();
    // TODO: This is not working on https://www.audible.com/pd/The-Sandman-Act-III-Audiobook/B0BFK1K36D
    let seriesDom = parentDom.find("a");
    console.log("Seires DOM", seriesDom);
    let seriesResult: ParseAudioBookSeries[] = [];
    if (seriesDom.length > 0) {
      seriesDom.each((i, elem) => {
        this.logger.debug("Found series", $(elem).text());
        let bookNumber = null;
        let dom = $(elem);
        let seriesLink = "https://www.audible.com" + dom.attr("href").split("?")[0];
        let seriesName = dom.text();
        let seriesId = seriesLink?.split("/")?.pop();

        if (bookNumbersTryGet.length > 0 && bookNumbersTryGet[i]) {
          let bookText = bookNumbersTryGet[i].nodeValue.toLowerCase() as string;
          bookNumber = bookText.slice(bookText.indexOf("book") + "book".length).trim();
          if (bookNumber.endsWith(",")) {
            bookNumber = bookNumber.slice(0, bookNumber.length - 1);
          }
        }

        seriesResult.push({
          name: seriesName,
          link: seriesLink,
          id: seriesId,
          bookNumber: bookNumber,
        });
      });
    }

    let categoryDom = $("li.categoriesLabel a");

    let categories: ParseAudioBookCategory[] = [];
    if (categoryDom.length > 0) {
      categoryDom.each((i, elem) => {
        let dom = $(elem);
        let categoryLink = "https://www.audible.com" + dom.attr("href")?.split("?")[0];
        let categoryName = dom.text();
        let categoryId = categoryLink?.split("/")?.pop();
        categories.push({
          name: categoryName,
          link: categoryLink,
          id: categoryId,
        });
      });
    }

    let tags: string[] = [];
    $(".product-topic-tags span.bc-chip-text").each((i, elem) => {
      tags.push($(elem).text().trim());
    });

    let image = $(".hero-content img.bc-pub-block").attr("src");

    return {
      amazon_id: amazon_id,
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
  }

  parseSeries(htmlDom: string): ParseSeries {
    let bookListUrls = [];
    const $ = cheerio.load(htmlDom, null, false);
    $("li.productListItem").each((i, elem) => {
      let dom = $(elem);
      let url = "https://www.audible.com" + dom.find("h3 a").attr("href")?.split("?")[0];
      bookListUrls.push(url);
    });

    let asin = $("input[name='asin']").attr("value");

    return {
      series_id: asin,
      bookUrls: bookListUrls,
    };
  }

  async downloadHtml(downloadUrl: string): Promise<string | null> {
    let html = await StorageService.getWebCache(downloadUrl);
    if (html) {
      this.logger.debug("Using cached html for " + downloadUrl);
      return html;
    }

    this.logger.debug("Downloading HTML from: ", downloadUrl);
    const config = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0",
      },
    };

    try {
      const { headers, status, data } = await axios.get(downloadUrl, config);
      // This is temp
      await StorageService.saveWebCache(downloadUrl, data);
      // End temp
      return data;
    } catch (error: any) {
      this.logger.error("Error (Status code: " + error.status + ") while downloading book html for " + downloadUrl);
      return null;
    }
  }
}

export default AudibleManagementService;
