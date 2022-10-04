import * as cheerio from "cheerio";
import axios from "axios";
import { APILogger } from "../logger/api.logger";
import * as fs from "fs";
import * as crypto from "crypto";
import ParseAudioBook, { ParseAudioBookSeries, ParseAudioBookCategory } from "../models/parsed_audiobook.model";
import ParseSeries from "../models/parsed_series.model";
import * as timespan from "timespan-parser";
import * as moment from "moment";

export class AudibleService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
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
      authors.push({
        name: $(elem).text(),
        link: "https://www.audible.com" + $(elem).attr("href")?.split("?")[0],
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
    let categoryResult: ParseAudioBookCategory | null = null;
    if (categoryDom.length > 0) {
      let categoryLink = "https://www.audible.com" + categoryDom.attr("href")?.split("?")[0];
      let categoryName = categoryDom.text();
      let categoryId = categoryLink?.split("/")?.pop();
      categoryResult = {
        name: categoryName,
        link: categoryLink,
        id: categoryId,
      };
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
      category: categoryResult,
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
    // This is temp
    let hash = crypto.createHash("md5").update(downloadUrl).digest("hex");
    if (!fs.existsSync(`./temp`)) {
      fs.mkdirSync(`./temp`);
    }
    if (fs.existsSync(`./temp/${hash}.html`)) {
      this.logger.info("File already exists, skipping download");
      return fs.readFileSync(`./temp/${hash}.html`, "utf8");
    }
    // End temp

    this.logger.debug("Downloading HTML from: ", downloadUrl);
    const config = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0",
      },
    };

    try {
      const { headers, status, data } = await axios.get(downloadUrl, config);
      // This is temp
      this.logger.info("Saving HTML to: ", `./temp/${hash}.html`);
      fs.writeFileSync(`./temp/${hash}.html`, data);
      // End temp
      return data;
    } catch (error: any) {
      this.logger.error("Error (Status code: " + error.status + ") while downloading book html for " + downloadUrl);
      return null;
    }
  }
}
