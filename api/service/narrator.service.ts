import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';
import * as MapUtil from '../util/Map.util';

export class AudibleNarratorService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async saveNarrator(narrator: string): Promise<AudibleNarrator> {
    this.logger.info('Saving narrator: ' + narrator);
    let check = await this.getNarratorByName(narrator);
    if (check) {
      this.logger.debug('Narrator ' + check.name + ' already exists');
      return check;
    }
    let sql = 'INSERT INTO `narrators` (`name`, `created`) VALUES (?,?);';
    let timespan = timeUtil.getNowTimestamp();
    let saveNarratorResult = await mysql.runQuery(sql, [narrator, timespan]);
    let narratorId = saveNarratorResult.insertId;
    return {
      id: narratorId,
      name: narrator,
      created: timeUtil.dateFromTimestamp(timespan),
    };
  }

  async addBookToNarrator(bookId: number, narrator: AudibleNarrator) {
    this.logger.info('Adding book ' + bookId + ' to narrator ' + narrator.id);
    let sql = 'SELECT * FROM `narrators_books` WHERE `book_id` = ? AND `narrator_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, narrator.id]);

    if (!results || results.length === 0) {
      sql = 'INSERT INTO `narrators_books` (`book_id`, `narrator_id`, `created`) VALUES (?, ?, ?)';
      let insertResult = await mysql.runQuery(sql, [bookId, narrator.id, timeUtil.getNowTimestamp()]);

      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `narrators` = concat(ifnull(`narrators`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart({ id: narrator.id, name: narrator.name }),
        bookId,
      ]);
    } else {
      this.logger.debug('Book ' + bookId + ' already added to narrator ' + narrator.id);
    }
  }

  async getNarratorByName(narrator: string): Promise<AudibleNarrator> {
    this.logger.info('Getting narrator by name: ' + narrator);
    let sql = 'SELECT * FROM `narrators` WHERE `name` = ?';
    let results = await mysql.runQuery(sql, [narrator]);
    if (!results || results.length === 0) {
      this.logger.debug('Narrator ' + narrator + ' did not exists');
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      created: timeUtil.dateFromTimestamp(results[0].created),
    };
  }

  async getNarrator(narratorId: number): Promise<AudibleNarrator> {
    this.logger.info('Getting narrator by id: ' + narratorId);
    let sql = 'SELECT * FROM `narrators` WHERE `id` = ?';
    let results = await mysql.runQuery(sql, [narratorId]);
    if (!results || results.length === 0) {
      this.logger.debug('Narrator ' + narratorId + ' did not exists');
      return null;
    }
    return {
      id: results[0].id,
      name: results[0].name,
      created: timeUtil.dateFromTimestamp(results[0].created),
    };
  }
}
