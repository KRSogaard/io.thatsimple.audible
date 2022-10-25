import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleTag, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';
import * as MapUtil from '../util/Map.util';

export class AudibleBookService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async getBookASIN(asin: string): Promise<AudibleBook> {
    this.logger.debug('Getting book by ASIN: ' + asin);
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `asin` = ?', [asin]);
    if (results.length === 0) {
      return null;
    }
    return this.parseBookResult(results[0], true);
  }

  async getBook(id: number): Promise<AudibleBook> {
    this.logger.debug('Getting book by ID: ' + id);
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `id` = ?', [id]);
    return await this.parseBookResult(results, true);
  }

  async getBooksIdsByUser(userId: number) {
    let results = await mysql.runQuery(
      'SELECT `books`.id FROM `books` ' + 'LEFT JOIN `users_books` ON `users_books`.book_id = `books`.id ' + 'WHERE `users_books`.user_id = ?',
      [userId]
    );
    return results.map((result) => result.id);
  }

  async bulkGetBooks(ids: number[]): Promise<AudibleBook[]> {
    this.logger.info('Getting books by IDs: ' + ids);
    let books = [];

    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `id` in (?)', [ids]);
    await Promise.all(results.map(async (bookResult) => books.push(await this.parseBookResult(bookResult, false))));
    return books;
  }

  async parseBookResult(result: any, getSeries: boolean): Promise<AudibleBook> {
    let series: AudibleSeriesBook[] = [];
    if (getSeries) {
      let seriesResult = await mysql.runQuery(
        'SELECT `series`.*, `series_books`.book_number FROM `series` ' +
          'LEFT JOIN `series_books` ON `series_books`.series_id = `series`.id ' +
          'WHERE `series_books`.book_id = ?',
        [result.id]
      );
      for (let seriesBook of seriesResult) {
        series.push({
          id: seriesBook.id,
          asin: seriesBook.asin,
          name: seriesBook.name,
          bookNumber: seriesBook.book_number,
          created: timeUtil.dateFromTimestamp(seriesBook.created),
        });
      }
    }

    let authors = [];
    for (let author of MapUtil.parseMap(result.authors) as AudibleAuthor[]) {
      authors.push({
        id: author.id,
        name: author.name,
        asin: author.asin,
        link: author.link,
      });
    }

    let narrators = [];
    for (let narrator of MapUtil.parseMap(result.narrators) as AudibleNarrator[]) {
      narrators.push({
        id: narrator.id,
        name: narrator.name,
      });
    }

    let tags = [];
    for (let tag of MapUtil.parseMap(result.tags) as AudibleTag[]) {
      tags.push(tag);
    }

    let categories = [];
    for (let category of MapUtil.parseMap(result.categories) as AudibleCategory[]) {
      categories.push(category);
    }

    return {
      id: result.id,
      asin: result.asin,
      link: result.link,
      title: result.title,
      length: result.length,
      released: timeUtil.dateFromTimestamp(result.released),
      summary: result.summary,
      lastUpdated: timeUtil.dateFromTimestamp(result.last_updated),
      series: series,
      authors: authors,
      narrators: narrators,
      categories: categories,
      tags: tags,
    };
  }

  async createTempBook(asin: string, link: string): Promise<number> {
    this.logger.debug('Creating temp book with asin: ' + asin, link);
    let sql = 'INSERT INTO `books` (`asin`, `link`, `created`) VALUES (?, ?, ?);';
    let saveBookResult = await mysql.runQuery(sql, [asin, link, timeUtil.getNowTimestamp()]);
    return saveBookResult.insertId as number;
  }

  async saveBook(book: AudibleBook): Promise<AudibleBook> {
    this.logger.info('Saving book: ' + book.title);

    let checkBook = await this.getBookASIN(book.asin);
    let bookId = 0;
    let saveBookResult = null;
    if (checkBook !== null) {
      this.logger.info('Book already exists, updating');
      let sql = 'UPDATE `books` SET `link` = ?, `title` = ?, `length` = ?, `released` = ?, `summary` = ?, `last_updated` = ? WHERE `asin` = ?;';
      saveBookResult = await mysql.runQuery(sql, [
        book.link,
        book.title,
        book.length,
        timeUtil.datetoTimestamp(book.released),
        book.summary,
        timeUtil.getNowTimestamp(),
        book.asin,
      ]);
      bookId = checkBook.id;
    } else {
      this.logger.info('New book, inserting');
      let sql = 'INSERT INTO `books` (`asin`, `link`, `title`, `length`, `released`, `summary`, `last_updated`, `created`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
      saveBookResult = await mysql.runQuery(sql, [
        book.asin,
        book.link,
        book.title,
        book.length,
        timeUtil.datetoTimestamp(book.released),
        book.summary ? book.summary : null,
        timeUtil.getNowTimestamp(),
        timeUtil.getNowTimestamp(),
      ]);
      bookId = saveBookResult.insertId;
    }
    if (bookId === 0) {
      this.logger.error('Failed to save book', book);
      return;
    }

    return await this.getBook(bookId);
  }
}
