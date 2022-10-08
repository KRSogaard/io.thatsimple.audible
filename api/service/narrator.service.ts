import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/time.util';

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
    let saveNarratorResult = await mysql.runQuery(sql, [narrator, timeUtil.getNowTimestamp()]);
    let narratorId = saveNarratorResult.insertId;
    return await this.getNarrator(narratorId);
  }

  async addBookToNarrator(bookId: number, narratorId: number) {
    this.logger.info('Adding book ' + bookId + ' to narrator ' + narratorId);
    let sql = 'SELECT * FROM `narrators_books` WHERE `book_id` = ? AND `narrator_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, narratorId]);

    if (!results || results.length === 0) {
      sql = 'INSERT INTO `narrators_books` (`book_id`, `narrator_id`, `created`) VALUES (?, ?, ?)';
      await mysql.runQuery(sql, [bookId, narratorId, timeUtil.getNowTimestamp()]);
    } else {
      this.logger.debug('Book ' + bookId + ' already added to narrator ' + narratorId);
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
    };
  }
}
