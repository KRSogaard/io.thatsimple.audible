import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';
import * as MapUtil from '../util/Map.util';

export class AudibleCategoryService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async addCategoryToBook(bookId: number, category: AudibleCategory) {
    this.logger.info('Adding category ' + category.id + ' to book ' + bookId);

    let sql = 'SELECT * FROM `categories_books` WHERE `book_id` = ? AND `category_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, category.id]);
    if (!results || results.length === 0) {
      let sql = 'INSERT INTO `categories_books` (`book_id`, `category_id`, `created`) VALUES (?, ?, ?)';
      await mysql.runQuery(sql, [bookId, category.id, timeUtil.getNowTimestamp()]);

      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `categories` = concat(ifnull(`categories`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart({ id: category.id, name: category.name }),
        bookId,
      ]);
    } else {
      this.logger.debug('Category ' + category.id + ' already had book ' + bookId);
    }
  }

  async saveOrGetCategory(category: string, link: string): Promise<AudibleCategory> {
    this.logger.info('Saving category: ' + category);
    let check = await this.getCategoryByName(category);
    if (check) {
      this.logger.debug('Category ' + check.name + ' already exists');
      return check;
    }
    let sql = 'INSERT INTO `categories` (`name`, `link`, `created`) VALUES (?, ?, ?);';
    let timestamp = timeUtil.getNowTimestamp();
    let saveNarratorResult = await mysql.runQuery(sql, [category, link, timestamp]);
    let narratorId = saveNarratorResult.insertId;
    return {
      id: narratorId,
      name: category,
      link: link,
      created: timeUtil.dateFromTimestamp(timestamp),
    };
  }

  async getCategoryByName(category: string): Promise<AudibleCategory> {
    this.logger.info('Getting category by name: ' + category);
    let sql = 'SELECT * FROM `categories` WHERE `name` = ?';
    let results = await mysql.runQuery(sql, [category]);
    if (!results || results.length === 0) {
      this.logger.debug('Category ' + category + ' did not exists');
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      link: results[0].link,
      created: timeUtil.dateFromTimestamp(results[0].created),
    };
  }

  async getCategory(categoryId: number): Promise<AudibleCategory> {
    this.logger.info('Getting category by id: ' + categoryId);
    let sql = 'SELECT * FROM `categories` WHERE `id` = ?';
    let results = await mysql.runQuery(sql, [categoryId]);
    if (!results || results.length === 0) {
      this.logger.debug('Category with id ' + categoryId + ' did not exists');
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      link: results[0].link,
      created: timeUtil.dateFromTimestamp(results[0].created),
    };
  }
}
