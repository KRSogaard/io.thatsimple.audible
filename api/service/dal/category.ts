import { APILogger } from '../../logger/api.logger';
import * as mysql from '../../util/MySQL.util';
import * as timeUtil from '../../util/Time.util';
import * as MapUtil from '../../util/Map.util';
import { AudibleCategory, IdValueInfo } from './models';

export class CategoryService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger('CategoryService');
  }

  async addCategoryToBook(bookId: number, category: AudibleCategory) {
    this.logger.trace('Adding category ' + category.id + ' to book ' + bookId);

    let sql = 'SELECT * FROM `categories_books` WHERE `book_id` = ? AND `category_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, category.id]);
    if (!results || results.length === 0) {
      let sql = 'INSERT INTO `categories_books` (`book_id`, `category_id`, `created`) VALUES (?, ?, ?)';
      await mysql.runQuery(sql, [bookId, category.id, timeUtil.getNowTimestamp()]);

      let mapPart: IdValueInfo = { id: category.id, value: category.name };
      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `categories_cache` = concat(ifnull(`categories_cache`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart(mapPart),
        bookId,
      ]);
    } else {
      this.logger.trace('Category ' + category.id + ' already had book ' + bookId);
    }
  }

  async saveOrGetCategory(category: string, link: string): Promise<AudibleCategory> {
    this.logger.trace('Saving category: ' + category);
    let check = await this.getCategoryByName(category);
    if (check) {
      this.logger.trace('Category ' + check.name + ' already exists');
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
      created: timestamp,
    };
  }

  async getCategoryByName(category: string): Promise<AudibleCategory> {
    this.logger.trace('Getting category by name: ' + category);
    let sql = 'SELECT * FROM `categories` WHERE `name` = ?';
    let results = await mysql.runQuery(sql, [category]);
    if (!results || results.length === 0) {
      this.logger.trace('Category ' + category + ' did not exists');
      return null;
    }
    return this.parseSqlResultToCategory(results[0]);
  }

  async getCategory(categoryId: number): Promise<AudibleCategory> {
    this.logger.trace('Getting category by id: ' + categoryId);
    let sql = 'SELECT * FROM `categories` WHERE `id` = ?';
    let results = await mysql.runQuery(sql, [categoryId]);
    if (!results || results.length === 0) {
      this.logger.trace('Category with id ' + categoryId + ' did not exists');
      return null;
    }
    return this.parseSqlResultToCategory(results[0]);
  }

  parseSqlResultToCategory(result: any): AudibleCategory {
    return {
      id: result.id,
      name: result.name,
      link: result.link,
      created: result.created,
    };
  }

  async getCategoriesForBook(bookId: number): Promise<AudibleCategory[]> {
    let categories = [];
    let categoryResult = await mysql.runQuery(
      'SELECT `authors`.* FROM `authors` LEFT JOIN `authors_books` ON `authors_books`.author_id = `authors`.id WHERE `authors_books`.book_id = ?',
      [bookId]
    );
    for (let cat of categoryResult) {
      categories.push(this.parseSqlResultToCategory(cat));
    }
    return categories;
  }
}
