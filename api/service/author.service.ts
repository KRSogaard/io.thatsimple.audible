import { APILogger } from '../logger/api.logger';
import { AudibleAuthor } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';
import * as MapUtil from '../util/Map.util';

export class AudibleAuthorService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async saveAuthor(name: string, asin: string, link: string): Promise<AudibleAuthor> {
    this.logger.info('Saving author: ' + name);
    let check = await this.getAuthorASIN(asin);
    if (check) {
      this.logger.info('Author ' + name + ' already exists');
      return check;
    }
    let sql = 'INSERT INTO `authors` (`name`, `asin`, `link`, `created`) VALUES (?, ?, ?, ?);';
    let timespan = timeUtil.getNowTimestamp();
    let saveResult = await mysql.runQuery(sql, [name, asin, link, timespan]);
    return {
      id: saveResult.insertId,
      name: name,
      asin: asin,
      link: link,
      created: timeUtil.dateFromTimestamp(timespan),
    };
  }

  async getAuthor(id: number): Promise<AudibleAuthor> {
    this.logger.debug('Getting author by id: ' + id);
    let sql = 'SELECT * FROM `authors` WHERE `id` = ?';
    let results = await mysql.runQuery(sql, [id]);
    return this.parseAuthorResult(results);
  }

  async getAuthorASIN(asin: string): Promise<AudibleAuthor> {
    this.logger.debug('Getting author by ASIN:' + asin);
    let sql = 'SELECT * FROM `authors` WHERE `asin` = ?';
    let results = await mysql.runQuery(sql, [asin]);
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
      created: timeUtil.dateFromTimestamp(results[0].created),
    };
  }

  async addBookToAuthor(bookId: number, author: AudibleAuthor): Promise<void> {
    this.logger.info('Adding book ' + bookId + ' to author ' + author.id);
    let sql = 'SELECT * FROM `books_authors` WHERE `book_id` = ? AND `author_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, author.id]);
    if (!results || results.length === 0) {
      sql = 'INSERT INTO `books_authors` (`book_id`, `author_id`, `created`) VALUES (?, ?, ?);';
      await mysql.runQuery(sql, [bookId, author.id, Math.round(Date.now() / 1000)]);

      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `authors` = concat(ifnull(`authors`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart({ id: author.id, name: author.name, asin: author.asin }),
        bookId,
      ]);
    } else {
      this.logger.debug('Book ' + bookId + ' already in author ' + author.id);
    }
  }
}
