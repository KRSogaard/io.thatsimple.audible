import { APILogger } from "../logger/api.logger";
import { AudibleService } from "./audible.service";
import ParseSeries from "../models/parsed_series.model";
import * as timespan from "timespan-parser";
import * as moment from "moment";
import * as cheerio from "cheerio";
import axios, { ResponseType } from "axios";
import StorageService from "./storage.service";
import ParseAudioBook, { ParseAudioBookSeries, ParseAudioBookCategory } from "../models/parsed_audiobook.model";
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from "../models/audiblebook.model";
import { RabbitMQConnection, RabbitMQAudibleChannel } from "../config/rabbitmq.config";

export class AudibleManagementService {
  public logger: APILogger;
  public audibleService: AudibleService;

  constructor() {
    this.logger = new APILogger();
    this.audibleService = new AudibleService();
  }

  async downloadBook(url: string): Promise<void> {
    let bookId = url.split("?")[0]?.split("/")?.pop();
    if (!bookId) {
      throw new Error("Failed to parse book id");
    }

    let bookObj = await this.audibleService.getBookASIN(bookId);
    if (bookObj !== null) {
      this.logger.debug("Book already exists in database");
      console.log("Last updated: ", bookObj.lastUpdated, ", one month ago: ", moment().subtract(1, "month").toDate());
      if (bookObj.lastUpdated <= moment().subtract(1, "month").toDate()) {
        this.logger.debug("Cached book is older than 1 month, updating");
      } else {
        return;
      }
    }

    let html = await this.downloadHtml(url);
    if (!html || html.length < 100) {
      throw new Error("Failed to download book html");
    }
    let book = this.parseBook(html);

    let newBook = await this.audibleService.saveBook({
      asin: book.amazon_id,
      link: book.link,
      title: book.title,
      length: book.runtime,
      released: new Date(book.released * 1000),
      summary: book.summary,
      series: book.series.map((s): AudibleSeriesBook => {
        return {
          asin: s.id,
          link: s.link,
          name: s.name,
          summary: s.summary,
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

    if (newBook && book.image) {
      if (!StorageService.hasImage(newBook.asin)) {
        this.logger.debug("Downloading image for book: ", [newBook.title, newBook.asin]);
        let image = await this.downloadImage(book.image);
        await StorageService.saveImage(newBook.asin, image);
      } else {
        this.logger.debug("Image already exists for book: ", [newBook.title, newBook.asin]);
      }
    }

    if (newBook.series) {
      newBook.series.forEach((s: AudibleSeries) => {
        this.logger.info("Downloaded series: " + s.name);
        this.downloadSeries(s.link);
      });
    }
  }

  async downloadSeries(url: string): Promise<void> {
    this.logger.debug("Downloading series: ", url);

    // ToDo: check if series need update
    let check = await this.audibleService.getSeriesASIN(url.split("?")[0]?.split("/")?.pop());
    if (check !== null && !check.shouldDownload && check.lastUpdated > moment().subtract(1, "month").toDate()) {
      this.logger.debug("Series already exists in database and is less then 1 month old");
      return;
    }

    let html = await this.downloadHtml(url);
    if (!html || html.length < 100) {
      throw new Error("Failed to download series html");
    }
    let series = this.parseSeries(html);
    console.log("Parsed series: ", series);
    let saveSeries = await this.audibleService.saveSeries({
      asin: series.asin,
      link: series.link,
      name: series.title,
      summary: series.summary,
    });
    this.logger.debug("Series " + series.title + " has " + series.books.length + " books");

    for (let book of series.books) {
      let savedBook = await this.audibleService.getBookASIN(book.asin);
      if (savedBook === null) {
        this.logger.debug("Book not found in database, creating temp book", book.asin);
        let bookId = await this.audibleService.createTempBook(book.asin, book.link);
        await this.audibleService.addBookToSeries(bookId, saveSeries.id, book.bookNumber);
        this.sendDownloadBook(book.link);
      } else {
        let series = savedBook.series.filter((s) => s.asin === saveSeries.asin);
        if (series.length === 0) {
          this.logger.debug("Adding book to series: ", [savedBook.title, saveSeries.asin, saveSeries.name]);
          await this.audibleService.addBookToSeries(savedBook.id, saveSeries.id, book.bookNumber);
        } else {
          this.logger.debug("Book already exists in series: ", [savedBook.title, savedBook.asin]);
          if (book.bookNumber != null && book.bookNumber.length > 0 && series[0].bookNumber !== book.bookNumber) {
            this.logger.debug("Updating book number for book: ", [savedBook.title, savedBook.asin, book.bookNumber]);
            await this.audibleService.updateBookSeries(savedBook.id, series[0].id, book.bookNumber);
          }
        }
      }
    }
    await this.audibleService.setSeriesShouldDownload(saveSeries.id, false);
    this.logger.debug("Finished downloading series: ", series.title);
  }

  async sendDownloadBook(url: string): Promise<void> {
    this.logger.debug("Sending download book request: ", url);
    RabbitMQConnection().then((connection) => {
      connection.createChannel().then(async (channel) => {
        //await channel.assertQueue(RabbitMQAudibleChannel());
        channel.sendToQueue(
          RabbitMQAudibleChannel(),
          Buffer.from(
            JSON.stringify({
              url: url,
              type: "book",
            })
          )
        );
      });
    });
  }

  async sendDownloadSeries(url: string): Promise<void> {
    this.logger.debug("Sending download series request: ", url);
    RabbitMQConnection().then((connection) => {
      connection.createChannel().then(async (channel) => {
        //await channel.assertQueue(RabbitMQAudibleChannel());
        channel.sendToQueue(
          RabbitMQAudibleChannel(),
          Buffer.from(
            JSON.stringify({
              url: url,
              type: "series",
            })
          )
        );
      });
    });
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
    let seriesDom = parentDom.find("a");
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

    let title = $("h1.bc-heading").first().text().trim();
    let summary = $(".bc-expander-content").text().trim();
    let link = $("link[rel='canonical']").attr("href");

    $("li.productListItem").each((i, elem) => {
      let dom = $(elem);
      let url = "https://www.audible.com" + dom.find("h3 a").attr("href")?.split("?")[0];
      let text = dom.find("h2.bc-heading").first().text().trim();
      let bookNumber = null;
      if (text && text.length > 0 && text.toLowerCase().includes("book")) {
        bookNumber = text.slice(text.indexOf("book") + "book".length + 1).trim();
      }

      let runtimeSeconds = null;
      text = dom.find(".runtimeLabel").text().trim();
      if (text && text.length > 0 && text.includes("Length:")) {
        text = text.slice(text.indexOf("Length:") + "Length:".length + 1).trim();
        let runtime = text.replace("hrs", "h").replace("mins", "m").replace("and", "").trim();
        runtimeSeconds = timespan.parse(runtime);
      }

      let releaseDate = null;
      text = dom.find(".releaseDateLabel").text().trim();
      if (text && text.length > 0 && text.includes("date:")) {
        text = text.slice(text.indexOf("date:") + "date:".length + 1).trim();
        releaseDate = Math.floor(new Date(text).getTime() / 1000);
      }

      bookListUrls.push({
        link: url,
        asin: url.split("?")[0].split("/")?.pop(),
        bookNumber: bookNumber,
        runtime: runtimeSeconds,
        releaseDate: releaseDate,
      });
    });

    let asin = $("input[name='asin']").attr("value");

    return {
      link: link,
      title: title,
      summary: summary,
      asin: asin,
      books: bookListUrls,
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

  async downloadImage(downloadUrl: string): Promise<Buffer> {
    const config = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0",
      },
      responseType: <ResponseType>"arraybuffer",
    };

    try {
      const { headers, status, data } = await axios.get(downloadUrl, config);
      return data;
    } catch (error: any) {
      this.logger.error("Error (Status code: " + error.status + ") while downloading book image for " + downloadUrl);
    }
  }
}

export default AudibleManagementService;
