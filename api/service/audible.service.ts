import { APILogger } from "../logger/api.logger";
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from "../models/audiblebook.model";
import { MySQLConnection, Pool } from "../config/mysql.config";

export class AudibleService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async getBookASIN(asin: string): Promise<AudibleBook> {
    this.logger.debug("Getting book by ASIN", asin);
    let results = await this.runQuery("SELECT * FROM `books` WHERE `asin` = ?", [asin]);
    return this.parseBookResult(results);
  }

  async getBook(id: number): Promise<AudibleBook> {
    this.logger.debug("Getting book by ID", id);
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
        lastUpdated: this.dateFromTimestamp(seriesBook.last_updated),
        bookNumber: seriesBook.book_number,
        summary: seriesBook.summary,
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
      released: this.dateFromTimestamp(results[0].released),
      summary: results[0].summary,
      lastUpdated: this.dateFromTimestamp(results[0].last_updated),
      series: series,
      authors: authors,
      tags: tags,
    };
  }

  dateFromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }
  getNowTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
  datetoTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  async setSeriesShouldDownload(seriesId: number, shouldDownload: boolean) {
    let sql = "UPDATE `series` SET `should_download` = ? WHERE `id` = ?";
    await this.runQuery(sql, [shouldDownload, seriesId]);
  }

  async getSeries(id: string): Promise<AudibleSeries> {
    let sql = "SELECT * FROM `series` " + "WHERE `series`.id = ?";
    let results = await this.runQuery(sql, [id]);
    return this.parseSeriesResult(results);
  }

  async getSeriesASIN(asin: string): Promise<AudibleSeries> {
    let sql = "SELECT * FROM `series` " + "WHERE `series`.asin = ?";
    let results = await this.runQuery(sql, [asin]);
    return this.parseSeriesResult(results);
  }

  parseSeriesResult(results: any): AudibleSeries {
    if (!results || results.length === 0) {
      return null;
    }

    return {
      id: results[0].id,
      name: results[0].name,
      asin: results[0].asin,
      link: results[0].link,
      summary: results[0].summary,
      lastUpdated: this.dateFromTimestamp(results[0].last_updated),
      shouldDownload: results[0].should_download === 1,
    };
  }

  async getPool(): Promise<Pool> {
    return await MySQLConnection();
  }

  async createTempBook(asin: string, link: string): Promise<number> {
    let sql = "INSERT INTO `books` (`asin`, `link`, `created`) VALUES (?, ?, ?);";
    let saveBookResult = await this.runQuery(sql, [asin, link, this.getNowTimestamp()]);
    return saveBookResult.insertId as number;
  }

  async saveBook(book: AudibleBook): Promise<AudibleBook> {
    this.logger.debug("Saving book", book);

    let checkBook = await this.getBookASIN(book.asin);
    let bookId = 0;
    let saveBookResult = null;
    if (checkBook !== null) {
      let sql = "UPDATE `books` SET `link` = ?, `title` = ?, `length` = ?, `released` = ?, `summary` = ?, `last_updated` = ? WHERE `asin` = ?;";
      saveBookResult = await this.runQuery(sql, [
        book.link,
        book.title,
        book.length,
        this.datetoTimestamp(book.released),
        book.summary,
        this.getNowTimestamp(),
        book.asin,
      ]);
      bookId = checkBook.id;
    } else {
      let sql =
        "INSERT INTO `books` (`asin`, `link`, `title`, `length`, `released`, `summary`, `last_updated`, `created`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
      saveBookResult = await this.runQuery(sql, [
        book.asin,
        book.link,
        book.title,
        book.length,
        this.datetoTimestamp(book.released),
        book.summary,
        this.getNowTimestamp(),
        this.getNowTimestamp(),
      ]);
      bookId = saveBookResult.insertId;
    }
    if (bookId === 0) {
      this.logger.error("Failed to save book [" + JSON.stringify(book) + "]");
    }

    for (let series of book.series) {
      let saveSeries = await this.saveSeries(series);
      await this.addBookToSeries(bookId, saveSeries.id, series.bookNumber);
      // we want the series to be downloaded
      await this.setSeriesShouldDownload(saveSeries.id, true);
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
      let saveCategory = await this.saveCategory(category.name, category.link);
      await this.addCategoryToBook(bookId, saveCategory.id);
    }

    return await this.getBook(bookId);
  }

  async addCategoryToBook(bookId: number, categoryId: number) {
    this.logger.debug("Adding category to book", [categoryId, bookId]);

    let sql = "SELECT * FROM `categories_books` WHERE `book_id` = ? AND `category_id` = ?";
    let results = await this.runQuery(sql, [bookId, categoryId]);
    if (!results || results.length === 0) {
      let sql = "INSERT INTO `categories_books` (`book_id`, `category_id`, `created`) VALUES (?, ?, ?)";
      await this.runQuery(sql, [bookId, categoryId, this.getNowTimestamp()]);
    } else {
      this.logger.debug("Category already added to book", [categoryId, bookId]);
    }
  }

  async saveCategory(category: string, link: string): Promise<AudibleCategory> {
    let check = await this.getCategoryByName(category);
    if (check) {
      this.logger.debug("Category already exists", check);
      return check;
    }
    this.logger.debug("Saving category", category);
    let sql = "INSERT INTO `categories` (`name`, `link`, `created`) VALUES (?, ?, ?);";
    let saveNarratorResult = await this.runQuery(sql, [category, link, this.getNowTimestamp()]);
    let narratorId = saveNarratorResult.insertId;
    return await this.getCategory(narratorId);
  }

  async getCategoryByName(category: string): Promise<AudibleCategory> {
    let sql = "SELECT * FROM `categories` WHERE `name` = ?";
    let results = await this.runQuery(sql, [category]);
    if (!results || results.length === 0) {
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      link: results[0].link,
    };
  }

  async getCategory(categoryId: number): Promise<AudibleCategory> {
    let sql = "SELECT * FROM `categories` WHERE `id` = ?";
    let results = await this.runQuery(sql, [categoryId]);
    if (!results || results.length === 0) {
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      link: results[0].link,
    };
  }

  async saveNarrator(narrator: string): Promise<AudibleNarrator> {
    let check = await this.getNarratorByName(narrator);
    if (check) {
      this.logger.debug("Narrator already exists", check);
      return check;
    }
    this.logger.debug("Saving narrator", narrator);
    let sql = "INSERT INTO `narrators` (`name`, `created`) VALUES (?,?);";
    let saveNarratorResult = await this.runQuery(sql, [narrator, this.getNowTimestamp()]);
    let narratorId = saveNarratorResult.insertId;
    return await this.getNarrator(narratorId);
  }

  async addBookToNarrator(bookId: number, narratorId: number) {
    this.logger.debug("Adding book to narrator", [bookId, narratorId]);
    let sql = "SELECT * FROM `narrators_books` WHERE `book_id` = ? AND `narrator_id` = ?";
    let results = await this.runQuery(sql, [bookId, narratorId]);

    if (!results || results.length === 0) {
      sql = "INSERT INTO `narrators_books` (`book_id`, `narrator_id`, `created`) VALUES (?, ?, ?)";
      await this.runQuery(sql, [bookId, narratorId, this.getNowTimestamp()]);
    } else {
      this.logger.debug("Book already added to narrator", [bookId, narratorId]);
    }
  }

  async getNarratorByName(narrator: string): Promise<AudibleNarrator> {
    let sql = "SELECT * FROM `narrators` WHERE `name` = ?";
    let results = await this.runQuery(sql, [narrator]);
    if (!results || results.length === 0) {
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
    };
  }

  async getNarrator(narratorId: number): Promise<AudibleNarrator> {
    let sql = "SELECT * FROM `narrators` WHERE `id` = ?";
    let results = await this.runQuery(sql, [narratorId]);
    if (!results || results.length === 0) {
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
    };
  }

  async saveSeries(series: AudibleSeries): Promise<AudibleSeries> {
    console.log("Got series", series);
    let check = await this.getSeriesASIN(series.asin);
    if (check || (check && check.shouldDownload)) {
      this.logger.info("Series already exists", series);

      if (series.summary && series.summary.length > 0 && series.summary !== check.summary) {
        this.logger.info("Updating series summary", series);
        let sql = "UPDATE `series` SET `summary` = ? WHERE `id` = ?";
        await this.runQuery(sql, [series.summary, check.id]);
      }

      return check;
    }
    this.logger.debug("Saving series", series);
    let sql = "INSERT INTO `series` (`asin`, `link`, `name`, `last_updated`, `summary`, `created`, `should_download`) VALUES (?, ?, ?, ?, ?, ?, ?);";
    await this.runQuery(sql, [
      series.asin,
      series.link,
      series.name,
      Math.round(Date.now() / 1000),
      series.summary,
      Math.round(Date.now() / 1000),
      0,
    ]);
    this.logger.info("Saved series", series);
    return await this.getSeriesASIN(series.asin);
  }

  async addBookToSeries(bookId: number, seriesId: number, bookNumber: string): Promise<any> {
    this.logger.debug("Adding book to series", [bookId, seriesId, bookNumber]);

    let sql = "SELECT * FROM `series_books` WHERE `book_id` = ? AND `series_id` = ?";
    let results = await this.runQuery(sql, [bookId, seriesId]);
    if (!results || results.length === 0) {
      let sql = "INSERT INTO `series_books` (`book_id`, `series_id`, `book_number`, `created`) VALUES (?, ?, ?, ?);";
      if (!bookNumber || bookNumber === "") {
        bookNumber = null;
      }
      await this.runQuery(sql, [bookId, seriesId, bookNumber, Math.round(Date.now() / 1000)]);
    } else {
      this.logger.debug("Book already in series", [bookId, seriesId]);
      if (bookNumber != null && bookNumber !== "" && results[0].book_number !== bookNumber) {
        this.logger.debug("Updating book number", [bookId, seriesId, bookNumber]);
        let sql = "UPDATE `series_books` SET `book_number` = ? WHERE `book_id` = ? AND `series_id` = ?";
        await this.runQuery(sql, [bookNumber, bookId, seriesId]);
      }
    }
    await this.updateSeries(seriesId);
  }

  async updateBookSeries(bookId: number, seriesId: number, bookNumber: string): Promise<any> {
    this.logger.debug("Updating book series", [bookId, seriesId, bookNumber]);
    let sql = "UPDATE `series_books` SET `book_number` = ?, `last_updated` = ? WHERE `book_id` = ? AND `series_id` = ?";
    await this.runQuery(sql, [bookNumber, Math.round(Date.now() / 1000), bookId, seriesId]);
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
    let sql = "INSERT INTO `authors` (`name`, `asin`, `link`, `created`) VALUES (?, ?, ?, ?);";
    let saveResult = await this.runQuery(sql, [author.name, author.asin, author.link, Math.round(Date.now() / 1000)]);
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

  async addBookToUser(bookId: number, userId: number): Promise<any> {
    this.logger.debug("Adding book to user", [bookId, userId]);
    let sql = "SELECT * FROM `users_books` WHERE `book_id` = ? AND `user_id` = ?";
    let results = await this.runQuery(sql, [bookId, userId]);
    if (!results || results.length === 0) {
      let sql = "INSERT INTO `users_books` (`book_id`, `user_id`, `created`) VALUES (?, ?, ?);";
      await this.runQuery(sql, [bookId, userId, Math.round(Date.now() / 1000)]);
    } else {
      this.logger.debug("Book already in user's library", [bookId, userId]);
    }
  }

  async addBookToAuthor(bookId: number, authorId: number): Promise<void> {
    this.logger.debug("Adding book to author", [bookId, authorId]);
    let sql = "SELECT * FROM `books_authors` WHERE `book_id` = ? AND `author_id` = ?";
    let results = await this.runQuery(sql, [bookId, authorId]);
    if (!results || results.length === 0) {
      sql = "INSERT INTO `books_authors` (`book_id`, `author_id`, `created`) VALUES (?, ?, ?);";
      await this.runQuery(sql, [bookId, authorId, Math.round(Date.now() / 1000)]);
    } else {
      this.logger.debug("Book already in author", bookId, authorId);
    }
  }

  async saveTag(bookId: number, tag: string): Promise<void> {
    let sql = "SELECT * FROM `tags` WHERE `book_id` = ? AND `tag` = ?";
    let results = await this.runQuery(sql, [bookId, tag]);
    if (!results || results.length === 0) {
      sql = "INSERT INTO `tags` (`book_id`, `tag`, `created`) VALUES (?, ?, ?)";
      await this.runQuery(sql, [bookId, tag, Math.round(Date.now() / 1000)]);
    } else {
      this.logger.debug("Tag already in book", bookId, tag);
    }
  }

  async runQuery(sqlQuery: string, values: any | any[]): Promise<any> {
    return new Promise(function (resolve, reject) {
      new APILogger().debug("Submitting query", sqlQuery, values);
      MySQLConnection().then((pool) => {
        pool.query(sqlQuery, values, function (error, results, fields) {
          if (error) {
            reject(error);
          } else resolve(results);
        });
      });
    });
  }
}
