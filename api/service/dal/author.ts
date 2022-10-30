import { APILogger } from '../../logger/api.logger';
import * as mysql from '../../util/MySQL.util';
import * as timeUtil from '../../util/Time.util';
import * as MapUtil from '../../util/Map.util';
import { AudibleAuthor, IdValueInfo } from './models';

export class AuthorService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger('AuthorService');
  }

  async saveOrGetAuthor(name: string, asin: string, link: string): Promise<AudibleAuthor> {
    this.logger.trace('Saving author: ' + name);
    let check = await this.getAuthorASIN(asin);
    if (check) {
      this.logger.trace('Author ' + name + ' already exists');
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
      created: timespan,
    };
  }

  async getAuthor(id: number): Promise<AudibleAuthor> {
    this.logger.trace('Getting author by id: ' + id);
    let sql = 'SELECT * FROM `authors` WHERE `id` = ?';
    let results = await mysql.runQuery(sql, [id]);
    return this.parseAuthorResult(results);
  }

  async getAuthorASIN(asin: string): Promise<AudibleAuthor> {
    this.logger.trace('Getting author by ASIN:' + asin);
    let sql = 'SELECT * FROM `authors` WHERE `asin` = ?';
    let results = await mysql.runQuery(sql, [asin]);
    return this.parseAuthorResult(results);
  }

  async getAuthorsForBook(bookId: number): Promise<AudibleAuthor[]> {
    let authors = [];
    let authorResult = await mysql.runQuery(
      'SELECT `authors`.* FROM `authors` LEFT JOIN `authors_books` ON `authors_books`.author_id = `authors`.id WHERE `authors_books`.book_id = ?',
      [bookId]
    );
    for (let author of authorResult) {
      authors.push({
        id: author.id,
        name: author.name,
        asin: author.asin,
        link: author.link,
      });
    }
    return authors;
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
      created: results[0].created,
    };
  }

  async addBookToAuthor(bookId: number, author: AudibleAuthor): Promise<void> {
    this.logger.trace('Adding book ' + bookId + ' to author ' + author.id);
    let sql = 'SELECT * FROM `authors_books` WHERE `book_id` = ? AND `author_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, author.id]);
    if (!results || results.length === 0) {
      sql = 'INSERT INTO `authors_books` (`book_id`, `author_id`, `created`) VALUES (?, ?, ?);';
      await mysql.runQuery(sql, [bookId, author.id, timeUtil.getNowTimestamp()]);

      let mapPart: IdValueInfo = { id: author.id, value: author.name };
      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `authors_cache` = concat(ifnull(`authors_cache`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart(mapPart),
        bookId,
      ]);
    } else {
      this.logger.trace('Book ' + bookId + ' already in author ' + author.id);
    }
  }
}
