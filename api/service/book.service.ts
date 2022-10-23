import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';

export class AudibleBookService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async getBookASIN(asin: string): Promise<AudibleBook> {
    this.logger.debug('Getting book by ASIN: ' + asin);
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `asin` = ?', [asin]);
    return this.parseBookResult(results);
  }

  async getBook(id: number): Promise<AudibleBook> {
    this.logger.debug('Getting book by ID: ' + id);
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `id` = ?', [id]);
    return await this.parseBookResult(results);
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
    await Promise.all(ids.map(async (id) => books.push(await this.getBook(id))));
    return books;
  }

  async parseBookResult(results: any): Promise<AudibleBook> {
    if (results.length === 0) {
      return null;
    }

    let series: AudibleSeriesBook[] = [];
    let seriesResult = await mysql.runQuery(
      'SELECT `series`.*, `series_books`.book_number FROM `series` ' +
        'LEFT JOIN `series_books` ON `series_books`.series_id = `series`.id ' +
        'WHERE `series_books`.book_id = ?',
      [results[0].id]
    );
    for (let seriesBook of seriesResult) {
      series.push({
        id: seriesBook.id,
        name: seriesBook.name,
        asin: seriesBook.asin,
        link: seriesBook.link,
        lastUpdated: timeUtil.dateFromTimestamp(seriesBook.last_updated),
        bookNumber: seriesBook.book_number,
        summary: seriesBook.summary,
      });
    }

    let authors = [];
    let authorResult = await mysql.runQuery(
      'SELECT `authors`.* FROM `authors` LEFT JOIN `books_authors` ON `books_authors`.author_id = `authors`.id WHERE `books_authors`.book_id = ?',
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

    let narrators = [];
    let narratorsResult = await mysql.runQuery(
      'SELECT n.* FROM `narrators` AS n LEFT JOIN `narrators_books` AS nb ON nb.narrator_id = n.id WHERE nb.book_id = ?',
      [results[0].id]
    );
    for (let narrator of narratorsResult) {
      narrators.push({
        id: narrator.id,
        name: narrator.name,
      });
    }

    let tags = [];
    let tagResult = await mysql.runQuery('SELECT * FROM `tags` WHERE `tags`.book_id = ?', [results[0].id]);
    for (let tag of tagResult) {
      tags.push(tag.tag);
    }

    return {
      id: results[0].id,
      asin: results[0].asin,
      link: results[0].link,
      title: results[0].title,
      length: results[0].length,
      released: timeUtil.dateFromTimestamp(results[0].released),
      summary: results[0].summary,
      lastUpdated: timeUtil.dateFromTimestamp(results[0].last_updated),
      series: series,
      authors: authors,
      narrators: narrators,
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
