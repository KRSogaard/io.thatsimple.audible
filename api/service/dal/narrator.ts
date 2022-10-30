import { APILogger } from '../../logger/api.logger';
import { AudibleNarrator, IdValueInfo } from './models';
import * as mysql from '../../util/MySQL.util';
import * as timeUtil from '../../util/Time.util';
import * as MapUtil from '../../util/Map.util';

export class NarratorService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger('NarratorService');
  }

  async saveNarrator(narrator: string): Promise<AudibleNarrator> {
    this.logger.trace('Saving narrator: ' + narrator);
    let check = await this.getNarratorByName(narrator);
    if (check) {
      this.logger.trace('Narrator ' + check.name + ' already exists');
      return check;
    }
    let sql = 'INSERT INTO `narrators` (`name`, `created`) VALUES (?,?);';
    let timespan = timeUtil.getNowTimestamp();
    let saveNarratorResult = await mysql.runQuery(sql, [narrator, timespan]);
    let narratorId = saveNarratorResult.insertId;
    return {
      id: narratorId,
      name: narrator,
      created: timespan,
    };
  }

  async addBookToNarrator(bookId: number, narrator: AudibleNarrator) {
    this.logger.trace('Adding book ' + bookId + ' to narrator ' + narrator.id);
    let sql = 'SELECT * FROM `narrators_books` WHERE `book_id` = ? AND `narrator_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, narrator.id]);

    if (!results || results.length === 0) {
      sql = 'INSERT INTO `narrators_books` (`book_id`, `narrator_id`, `created`) VALUES (?, ?, ?)';
      await mysql.runQuery(sql, [bookId, narrator.id, timeUtil.getNowTimestamp()]);

      let mapPart: IdValueInfo = { id: narrator.id, value: narrator.name };
      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `narrators_cache` = concat(ifnull(`narrators_cache`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart(mapPart),
        bookId,
      ]);
    } else {
      this.logger.trace('Book ' + bookId + ' already added to narrator ' + narrator.id);
    }
  }

  async getNarratorByName(narrator: string): Promise<AudibleNarrator> {
    this.logger.trace('Getting narrator by name: ' + narrator);
    let sql = 'SELECT * FROM `narrators` WHERE `name` = ?';
    let results = await mysql.runQuery(sql, [narrator]);
    if (!results || results.length === 0) {
      this.logger.trace('Narrator ' + narrator + ' did not exists');
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      created: results[0].created,
    };
  }

  async getNarrator(narratorId: number): Promise<AudibleNarrator> {
    this.logger.trace('Getting narrator by id: ' + narratorId);
    let sql = 'SELECT * FROM `narrators` WHERE `id` = ?';
    let results = await mysql.runQuery(sql, [narratorId]);
    if (!results || results.length === 0) {
      this.logger.trace('Narrator ' + narratorId + ' did not exists');
      return null;
    }
    return this.parseSqlResult(results[0]);
  }

  async getNarratorsForBook(bookId: number): Promise<AudibleNarrator[]> {
    let narrators = [];
    let narratorsResult = await mysql.runQuery(
      'SELECT n.* FROM `narrators` AS n LEFT JOIN `narrators_books` AS nb ON nb.narrator_id = n.id WHERE nb.book_id = ?',
      [bookId]
    );
    for (let narrator of narratorsResult) {
      narrators.push(this.parseSqlResult(narrator));
    }
    return narrators;
  }

  parseSqlResult(result: any): AudibleNarrator {
    return {
      id: result.id,
      name: result.name,
      created: result.created,
    };
  }
}
