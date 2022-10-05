import { APILogger } from "../logger/api.logger";
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator } from "../models/audiblebook.model";
import { MySQLConnection, Pool } from "../config/mysql.config";

export class AudibleService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async getBookASIN(asin: string): Promise<AudibleBook> {
    let results = await this.runQuery("SELECT * FROM `books` WHERE `asin` = ?", [asin]);
    return this.parseBookResult(results);
  }

  async getBook(id: string): Promise<AudibleBook> {
    let results = await this.runQuery("SELECT * FROM `books` WHERE `id` = ?", [id]);
    return await this.parseBookResult(results);
  }
  async parseBookResult(results: any): Promise<AudibleBook> {
    if (results.length === 0) {
      return null;
    }

    let series: AudibleSeriesBook[] = [];
    let seriesResult = await this.runQuery(
      "SELECT `series`.*, `series_books`.book_number FROM `series` " +
        "LEFT JOIN `series_books` ON `series_books`.series_id = `series`.id " +
        "WHERE `series_books`.book_id = ?",
      [results[0].id]
    );
    for (let seriesBook of seriesResult) {
      series.push({
        id: seriesBook.id,
        name: seriesBook.name,
        asin: seriesBook.asin,
        link: seriesBook.link,
        lastUpdated: new Date(seriesBook.last_updated),
        bookNumber: seriesBook.book_number,
      });
    }

    let authors = [];
    let authorResult = await this.runQuery(
      "SELECT `authors`.* FROM `authors` " +
        "LEFT JOIN `books_authors` ON `books_authors`.author_id = `authors`.id " +
        "WHERE `books_authors`.book_id = ?",
      [results[0].id]
    );
    for (let author of authorResult) {
      authors.push({
        id: author.id,
        name: author.name,
        asin: author.asin,
        link: author.link,
      });
    }

    let tags = [];
    let tagResult = await this.runQuery("SELECT * FROM `tags` WHERE `tags`.book_id = ?", [results[0].id]);
    for (let tag of tagResult) {
      tags.push(tag.tag);
    }

    return {
      id: results[0].id,
      asin: results[0].asin,
      link: results[0].link,
      title: results[0].title,
      length: results[0].length,
      released: new Date(results[0].released),
      summary: results[0].summary,
      series: series,
      authors: authors,
      tags: tags,
    };
  }

  async getSeries(id: string): Promise<AudibleSeries> {
    let sql = "SELECT * FROM `series` " + "WHERE `series`.id = ?";
    let results = await this.runQuery(sql, [id]);
    return this.parseSeriesResult(results);
  }

  async getSeriesASIN(asin: string): Promise<any> {
    let sql = "SELECT * FROM `series` " + "WHERE `series`.asin = ?";
    let results = await this.runQuery(sql, [asin]);
    return this.parseSeriesResult(results);
  }

  parseSeriesResult(results: any): AudibleSeries {
    if (!results || results.length === 0) {
      return null;
    }

    console.log("Parse series result", results);

    return {
      id: results[0].id,
      name: results[0].name,
      asin: results[0].asin,
      link: results[0].link,
      lastUpdated: new Date(results[0].last_updated),
    };
  }

  async getPool(): Promise<Pool> {
    return await MySQLConnection();
  }

  async saveBook(book: AudibleBook): Promise<AudibleBook> {
    this.logger.debug("Saving book", book);
    let sql = "INSERT INTO `books` (`asin`, `link`, `title`, `length`, `released`, `summary`) VALUES (?, ?, ?, ?, ?, ?);";
    let saveBookResult = await this.runQuery(sql, [book.asin, book.link, book.title, book.length, book.released.getUTCSeconds(), book.summary]);
    let bookId = saveBookResult.insertId;
    console.log("Book ID", bookId);

    for (let series of book.series) {
      let saveSeries = await this.saveSeries(series);
      await this.addBookToSeries(bookId, saveSeries.id, series.bookNumber);
    }

    for (let author of book.authors) {
      let saveAuthor = await this.saveAuthor(author);
      await this.addBookToAuthor(bookId, saveAuthor.id);
    }

    for (let tag of book.tags) {
      await this.saveTag(bookId, tag);
    }

    for (let narrator of book.narrators) {
      let saveNarrator = await this.saveNarrator(narrator.name);
      await this.addBookToNarrator(bookId, saveNarrator.id);
    }

    for (let category of book.categories) {
      // let saveNarrator = await this.saveNarrator(narrator.name);
      // await this.addBookToNarrator(bookId, saveNarrator.id);
    }

    return await this.getBook(bookId);
  }

  async saveNarrator(narrator: string): Promise<AudibleNarrator> {
    let check = await this.getNarrator(narrator);
    if (check) {
      this.logger.debug("Narrator already exists", check);
      return check;
    }
    this.logger.debug("Saving narrator", narrator);
    let sql = "INSERT INTO `narrators` (`name`) VALUES (?);";
    let saveNarratorResult = await this.runQuery(sql, [narrator]);
    console.log("Narrator ID", saveNarratorResult);
    let narratorId = saveNarratorResult.insertId;
    return await this.getNarrator(narratorId);
  }

  async addBookToNarrator(bookId: number, narratorId: number) {
    this.logger.debug("Adding book to narrator", [bookId, narratorId]);
    let sql = "INSERT INTO `narrators_books` (`book_id`, `narrator_id`) VALUES (?, ?)";
    await this.runQuery(sql, [bookId, narratorId]);
  }

  async getNarrator(narrator: string): Promise<AudibleNarrator> {
    let sql = "SELECT * FROM `narrators` WHERE `id` = ?";
    let results = await this.runQuery(sql, [narrator]);
    if (!results || results.length === 0) {
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
    };
  }

  async saveSeries(series: AudibleSeries): Promise<AudibleSeries> {
    let check = await this.getSeriesASIN(series.asin);
    if (check) {
      this.logger.info("Series already exists", series);
      return check;
    }
    this.logger.debug("Saving series", series);
    let sql = "INSERT INTO `series` (`asin`, `link`, `name`, `last_updated`) VALUES (?, ?, ?, ?);";
    await this.runQuery(sql, [series.asin, series.link, series.name, Math.round(Date.now() / 1000)]);
    this.logger.info("Saved series", series);
    return await this.getSeriesASIN(series.asin);
  }

  async addBookToSeries(bookId: number, seriesId: number, bookNumber: string): Promise<any> {
    this.logger.debug("Adding book to series", [bookId, seriesId, bookNumber]);
    let sql = "INSERT INTO `series_books` (`book_id`, `series_id`, `book_number`) VALUES (?, ?, ?);";
    if (!bookNumber || bookNumber === "") {
      bookNumber = null;
    }
    await this.runQuery(sql, [bookId, seriesId, bookNumber]);
    await this.updateSeries(seriesId);
  }

  async updateSeries(seriesId: number) {
    this.logger.debug("Updating series's last updated time", seriesId);
    let sql = "UPDATE `series` SET `last_updated` = ? WHERE `id` = ?";
    await this.runQuery(sql, [Math.round(Date.now() / 1000), seriesId]);
  }

  async saveAuthor(author: AudibleAuthor): Promise<AudibleAuthor> {
    let check = await this.getAuthorASIN(author.asin);
    if (check) {
      this.logger.info("Author already exists", author);
      return check;
    }
    this.logger.debug("Saving author", author);
    let sql = "INSERT INTO `authors` (`name`, `asin`, `link`) VALUES (?, ?, ?);";
    let saveResult = await this.runQuery(sql, [author.name, author.asin, author.link]);
    this.logger.info("Saved author", author);
    return await this.getAuthor(saveResult.insertId);
  }

  async getAuthor(id: number): Promise<AudibleAuthor> {
    let sql = "SELECT * FROM `authors` WHERE `id` = ?";
    let results = await this.runQuery(sql, [id]);
    return this.parseAuthorResult(results);
  }

  async getAuthorASIN(asin: string): Promise<AudibleAuthor> {
    let sql = "SELECT * FROM `authors` WHERE `asin` = ?";
    let results = await this.runQuery(sql, [asin]);
    return this.parseAuthorResult(results);
  }

  parseAuthorResult(results: any): AudibleAuthor {
    if (!results || results.length === 0) {
      return null;
    }

    return {
      id: results[0].id,
      name: results[0].name,
      asin: results[0].asin,
      link: results[0].link,
    };
  }

  async addBookToAuthor(bookId: number, authorId: number): Promise<void> {
    this.logger.debug("Adding book to author", [bookId, authorId]);
    let sql = "INSERT INTO `books_authors` (`book_id`, `author_id`) VALUES (?, ?);";
    await this.runQuery(sql, [bookId, authorId]);
  }

  async saveTag(bookId: number, tag: string): Promise<void> {
    let sql = "INSERT INTO `tags` (`book_id`, `tag`) VALUES (?, ?)";
    await this.runQuery(sql, [bookId, tag]);
  }

  async runQuery(sqlQuery: string, values: any | any[]): Promise<any> {
    return new Promise(function (resolve, reject) {
      console.log("Submitting query", sqlQuery, values);
      MySQLConnection().then((pool) => {
        pool.query(sqlQuery, values, function (error, results, fields) {
          if (error) {
            console.log("Error", error);
            console.log("Results", results);
            console.log("Fields", fields);
            reject(error);
          } else resolve(results);
        });
      });
    });
  }

  async execute(sqlQuery: string, values: any | any[]): Promise<any> {
    return new Promise(function (resolve, reject) {
      console.log("Submitting query", sqlQuery, values);
      MySQLConnection().then((pool) => {
        pool.execute(sqlQuery, values, function (error, results, fields) {
          if (error) reject(error);
          else resolve(results);
        });
      });
    });
  }
}
