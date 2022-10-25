import { APILogger } from '../logger/api.logger';
import { AudibleTag } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';
import * as MapUtil from '../util/Map.util';

export class AudibleTagService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async getTagByName(tag: string): Promise<AudibleTag> {
    this.logger.info('Getting tag by name: ' + tag);
    let sql = 'SELECT * FROM `tags` WHERE `tag` = ?';
    let results = await mysql.runQuery(sql, [tag]);
    if (!results || results.length === 0) {
      this.logger.debug('Tag ' + tag + ' did not exists');
      return null;
    }
    return {
      id: results[0].id,
      tag: results[0].tag,
      created: timeUtil.dateFromTimestamp(results[0].created),
    };
  }

  async saveOrGetTag(tag: string): Promise<AudibleTag> {
    this.logger.info('Saving tag "' + tag + '"');

    let tagExisting = await this.getTagByName(tag);
    if (!tagExisting) {
      let sql = 'INSERT INTO `tags` (`tag`, `created`) VALUES (?, ?)';
      let timestamp = timeUtil.getNowTimestamp();
      let insertResult = await mysql.runQuery(sql, [tag, timestamp]);
      return {
        id: insertResult.insertId,
        tag: tag,
        created: timeUtil.dateFromTimestamp(timestamp),
      };
    }
    return tagExisting;
  }

  async addTagToBook(bookId: number, tag: AudibleTag) {
    this.logger.info('Adding tag ' + tag.id + ' to book ' + bookId);

    let sql = 'SELECT * FROM `tags_books` WHERE `book_id` = ? AND `tag_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, tag.id]);
    if (!results || results.length === 0) {
      let sql = 'INSERT INTO `tags_books` (`book_id`, `tag_id`, `created`) VALUES (?, ?, ?)';
      let insertResult = await mysql.runQuery(sql, [bookId, tag.id, timeUtil.getNowTimestamp()]);

      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `tags` = concat(ifnull(`tags`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart({ id: tag.id, tag: tag.tag }),
        bookId,
      ]);
    } else {
      this.logger.debug('Tag ' + tag.id + ' already had book ' + bookId);
    }
  }
}
