import { APILogger } from '../../logger/api.logger';
import * as mysql from '../../util/MySQL.util';
import * as timeUtil from '../../util/Time.util';
import * as MapUtil from '../../util/Map.util';
import { BulkAudibleBook, IdValueInfo, SimpleSeries, AudibleBook } from './models';
import { AuthorService } from './author';
import { NarratorService } from './narrator';
import { TagService } from './tag';
import { CategoryService } from './category';

export class BookService {
  logger: APILogger;
  authorService: AuthorService;
  narratorService: NarratorService;
  tagService: TagService;
  categoryService: CategoryService;

  constructor() {
    this.logger = new APILogger('BookService');
    this.authorService = new AuthorService();
    this.narratorService = new NarratorService();
    this.tagService = new TagService();
    this.categoryService = new CategoryService();
  }

  async getBookASIN(asin: string): Promise<AudibleBook | null> {
    this.logger.trace('Getting book by ASIN: ' + asin);
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `asin` = ?', [asin]);
    if (results.length === 0) {
      return null;
    }
    return this.parseBookResult(results[0], true);
  }

  async getBook(id: number): Promise<AudibleBook | null> {
    this.logger.trace('Getting book by ID: ' + id);
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `id` = ?', [id]);
    if (results.length === 0) {
      return null;
    }
    return await this.parseBookResult(results[0], true);
  }

  async parseBookResult(result: any, getSeries: boolean): Promise<AudibleBook> {
    const bookId = result.id;

    let series: SimpleSeries[] = [];
    if (getSeries) {
      series = await this.getSimpleSeriesForBook(result.id);
    }

    let authors = this.authorService.getAuthorsForBook(bookId);
    let narrators = this.narratorService.getNarratorsForBook(bookId);
    let tags = this.tagService.getTagsForBook(bookId);
    let categories = this.categoryService.getCategoriesForBook(bookId);

    return {
      id: result.id,
      asin: result.asin,
      link: result.link,
      title: result.title,
      length: result.length,
      released: result.released,
      summary: result.summary,
      lastUpdated: result.last_updated,
      series: series,
      authors: await authors,
      narrators: await narrators,
      categories: await categories,
      tags: await tags,
    };
  }

  async getBooksIdsByUser(userId: number) {
    let results = await mysql.runQuery(
      'SELECT `books`.id FROM `books` ' + 'LEFT JOIN `users_books` ON `users_books`.book_id = `books`.id ' + 'WHERE `users_books`.user_id = ?',
      [userId]
    );
    return results.map((result) => result.id);
  }

  async bulkGetBooks(ids: number[]): Promise<BulkAudibleBook[]> {
    this.logger.debug('Getting books by IDs: ' + ids);

    if (ids.length === 0) {
      throw new Error('No book IDs provided');
    }

    let books = [];
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `id` in (?)', [ids]);
    await Promise.all(results.map(async (bookResult) => books.push(await this.parseBulkBookResult(bookResult, false))));
    return books;
  }

  async getSimpleSeriesForBook(bookId: number): Promise<SimpleSeries[]> {
    let series: SimpleSeries[] = [];
    let seriesResult = await mysql.runQuery(
      'SELECT `series`.*, `series_books`.book_number FROM `series` ' +
        'LEFT JOIN `series_books` ON `series_books`.series_id = `series`.id ' +
        'WHERE `series_books`.book_id = ?',
      [bookId]
    );
    for (let seriesBook of seriesResult) {
      series.push({
        id: seriesBook.id,
        asin: seriesBook.asin,
        link: seriesBook.link,
        name: seriesBook.name,
        bookNumber: seriesBook.book_number,
      });
    }
    return series;
  }

  async parseBulkBookResult(result: any, getSeries: boolean): Promise<BulkAudibleBook> {
    let series: SimpleSeries[] = [];
    if (getSeries) {
      series = await this.getSimpleSeriesForBook(result.id);
    }

    let authors = [];
    for (let author of MapUtil.parseMap(result.authors_cache) as IdValueInfo[]) {
      authors.push({
        id: author.id,
        value: author.value,
      });
    }

    let narrators = [];
    for (let narrator of MapUtil.parseMap(result.narrators_cache) as IdValueInfo[]) {
      narrators.push({
        id: narrator.id,
        value: narrator.value,
      });
    }

    let tags = [];
    for (let tag of MapUtil.parseMap(result.tags_cache) as IdValueInfo[]) {
      tags.push({
        id: tag.id,
        value: tag.value,
      });
    }

    let categories = [];
    for (let category of MapUtil.parseMap(result.categories_cache) as IdValueInfo[]) {
      categories.push({
        id: category.id,
        value: category.value,
      });
    }

    return {
      id: result.id,
      asin: result.asin,
      link: result.link,
      title: result.title,
      length: result.length,
      released: result.released,
      summary: result.summary,
      lastUpdated: result.last_updated,
      series: series,
      authors: authors,
      narrators: narrators,
      categories: categories,
      tags: tags,
    };
  }

  async createTempBook(asin: string, link: string): Promise<number> {
    this.logger.trace('Creating temp book with asin: ' + asin + ', ' + link);
    let sql = 'INSERT INTO `books` (`asin`, `link`, `created`, `last_updated`) VALUES (?, ?, ?, ?);';
    let saveBookResult = await mysql.runQuery(sql, [asin, link, timeUtil.getNowTimestamp(), timeUtil.getNowTimestamp()]);
    return saveBookResult.insertId as number;
  }

  async saveBook(asin: string, link: string, title: string, length: number, released: number, summary?: string): Promise<AudibleBook> {
    this.logger.trace('Saving book: ' + title);

    let checkBook = await this.getBookASIN(asin);
    let bookId = 0;
    let saveBookResult = null;
    if (checkBook !== null) {
      this.logger.info('Book already exists, updating');
      let sql = 'UPDATE `books` SET `link` = ?, `title` = ?, `length` = ?, `released` = ?, `summary` = ?, `last_updated` = ? WHERE `asin` = ?;';
      saveBookResult = await mysql.runQuery(sql, [link, title, length, released, summary, timeUtil.getNowTimestamp(), asin]);
      bookId = checkBook.id;
    } else {
      this.logger.info('New book, inserting');
      let sql = 'INSERT INTO `books` (`asin`, `link`, `title`, `length`, `released`, `summary`, `last_updated`, `created`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
      saveBookResult = await mysql.runQuery(sql, [
        asin,
        link,
        title,
        length,
        released,
        summary ? summary : null,
        timeUtil.getNowTimestamp(),
        timeUtil.getNowTimestamp(),
      ]);
      bookId = saveBookResult.insertId;
    }
    if (bookId === 0) {
      this.logger.error('Failed to save book: ' + title);
      return;
    }

    return await this.getBook(bookId);
  }

  async getUnfinishedTempBooks(): Promise<AudibleBook[]> {
    let books: AudibleBook[] = [];
    let results = await mysql.runQuery('SELECT * FROM `books` WHERE `title` IS NULL AND `last_updated` < ? OR `last_updated` IS NULL', [
      timeUtil.getNowTimestamp() - 60 * 30,
    ]);
    for (let result of results) {
      let book = await this.parseBookResult(result, false);
      books.push(book);
    }
    if (books.length > 0) {
      let sql = 'UPDATE `books` SET `last_updated` = ? WHERE `id` in (?);';
      await mysql.runQuery(sql, [timeUtil.getNowTimestamp(), books.map((b) => b.id)]);
    }
    return books;
  }
}
