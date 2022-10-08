import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/time.util';

export class AudibleTagService {
    public logger: APILogger;

    constructor() {
        this.logger = new APILogger();
    }

    async saveTag(bookId: number, tag: string): Promise<void> {
        this.logger.info('Saving tag "' + tag + '" to book ' + bookId);
        let sql = 'SELECT * FROM `tags` WHERE `book_id` = ? AND `tag` = ?';
        let results = await mysql.runQuery(sql, [bookId, tag]);
        if (!results || results.length === 0) {
            sql = 'INSERT INTO `tags` (`book_id`, `tag`, `created`) VALUES (?, ?, ?)';
            await mysql.runQuery(sql, [bookId, tag, Math.round(Date.now() / 1000)]);
        } else {
            this.logger.debug('Tag "' + tag + '" already in book ' + bookId);
        }
    }
}
