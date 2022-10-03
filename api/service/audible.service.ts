import * as cheerio from "cheerio";
import axios from "axios";
import { APILogger } from "../logger/api.logger";
import * as fs from "fs";
import * as crypto from "crypto";
import ParseAudioBook, { ParseAudioBookSeries, ParseAudioBookCategory } from "../models/parsed_audiobook.model";
import * as timespan from "timespan-parser";

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

    let link = $("link[rel='canonical']").attr("href");
    let amazon_id = link?.split("/")?.pop();

    let authors = [];
    $(".authorLabel a").each((i, elem) => {
      authors.push({
        name: $(elem).text(),
        link: "https://www.audible.com" + $(elem).attr("href"),
      });
    });
    let narrators = [];
    $(".narratorLabel a").each((i, elem) => {
      narrators.push({
        name: $(elem).text(),
        link: "https://www.audible.com" + $(elem).attr("href"),
      });
    });

    let runtime = $("li.runtimeLabel").text().split(":")[1].replace("hrs", "h").replace("mins", "m").replace("and", "").trim();
    let runtimeSeconds = timespan.parse(runtime);

    let summary = "";

    $(".productPublisherSummary p").each((i, elem) => {
      summary += $(elem).text() + "\n";
    });

    let seriesDom = $("li.seriesLabel a");
    let seriesResult: ParseAudioBookSeries | null = null;
    if (seriesDom.length > 0) {
      let seriesLink = "https://www.audible.com" + seriesDom.attr("href").split("?")[0];
      let seriesName = seriesDom.text();
      let seriesId = seriesLink?.split("/")?.pop();
      let bookNumberTry1 = $("li.seriesLabel").text().split("Book")?.pop().trim();
      console.log("Test: ", bookNumberTry1);

      seriesResult = {
        name: seriesName,
        link: seriesLink,
        id: seriesId,
      };
    }

    let categoryDom = $("li.categoriesLabel a");
    let categoryResult: ParseAudioBookCategory | null = null;
    if (categoryDom.length > 0) {
      let categoryLink = "https://www.audible.com" + categoryDom.attr("href").split("?")[0];
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

    return {
      amazon_id: amazon_id,
      link: link,
      title: title,
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

  async downloadBookHtml(downloadUrl: string): Promise<string | null> {
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
