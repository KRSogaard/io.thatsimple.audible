import { APILogger } from '../../logger/api.logger';
import * as mysql from '../../util/MySQL.util';
import * as timeUtil from '../../util/Time.util';
import * as MapUtil from '../../util/Map.util';
import { AudibleTag, IdValueInfo } from './models';

export class TagService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger('TagService');
  }

  async getTagByName(tag: string): Promise<AudibleTag> {
    this.logger.trace('Getting tag by name: ' + tag);
    let sql = 'SELECT * FROM `tags` WHERE `tag` = ?';
    let results = await mysql.runQuery(sql, [tag]);
    if (!results || results.length === 0) {
      this.logger.trace('Tag ' + tag + ' did not exists');
      return null;
    }
    return this.parseSqlResultToTag(results[0]);
  }

  async saveOrGetTag(tag: string): Promise<AudibleTag> {
    this.logger.trace('Saving tag "' + tag + '"');

    let tagExisting = await this.getTagByName(tag);
    if (!tagExisting) {
      let sql = 'INSERT INTO `tags` (`tag`, `created`) VALUES (?, ?)';
      let timestamp = timeUtil.getNowTimestamp();
      let insertResult = await mysql.runQuery(sql, [tag, timestamp]);
      return {
        id: insertResult.insertId,
        tag: tag,
        created: timestamp,
      };
    }
    return tagExisting;
  }

  async addTagToBook(bookId: number, tag: AudibleTag) {
    this.logger.trace('Adding tag ' + tag.id + ' to book ' + bookId);

    let sql = 'SELECT * FROM `tags_books` WHERE `book_id` = ? AND `tag_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, tag.id]);
    if (!results || results.length === 0) {
      let sql = 'INSERT INTO `tags_books` (`book_id`, `tag_id`, `created`) VALUES (?, ?, ?)';
      await mysql.runQuery(sql, [bookId, tag.id, timeUtil.getNowTimestamp()]);

      let mapPart: IdValueInfo = { id: tag.id, value: tag.tag };
      await mysql.runQuery('UPDATE `books` SET `last_updated` = ?, `tags_cache` = concat(ifnull(`tags_cache`,""), ?) WHERE `id` = ?', [
        timeUtil.getNowTimestamp(),
        MapUtil.createMapPart(mapPart),
        bookId,
      ]);
    } else {
      this.logger.trace('Tag ' + tag.id + ' already had book ' + bookId);
    }
  }

  async getTagsForBook(bookId: number): Promise<AudibleTag[]> {
    let tags = [];
    let tagResult = await mysql.runQuery(
      'SELECT `tags`.* FROM `tags` LEFT JOIN `tags_books` ON `tags_books`.tag_id = `tags`.id WHERE `tags_books`.book_id = ?',
      [bookId]
    );
    for (let tag of tagResult) {
      tags.push(this.parseSqlResultToTag(tag));
    }
    return tags;
  }

  parseSqlResultToTag(result: any): AudibleTag {
    return {
      id: result.id,
      tag: result.tag,
      created: result.created,
    };
  }
}
