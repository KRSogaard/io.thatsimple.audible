import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/time.util';

export class AudibleUserService {
    public logger: APILogger;

    constructor() {
        this.logger = new APILogger();
    }

    async addBookToUser(bookId: number, userId: number): Promise<any> {
        this.logger.info('Adding book ' + bookId + ' to user ' + userId);
        let sql = 'SELECT * FROM `users_books` WHERE `book_id` = ? AND `user_id` = ?';
        let results = await mysql.runQuery(sql, [bookId, userId]);
        if (!results || results.length === 0) {
            let sql = 'INSERT INTO `users_books` (`book_id`, `user_id`, `created`) VALUES (?, ?, ?);';
            await mysql.runQuery(sql, [bookId, userId, Math.round(Date.now() / 1000)]);
        } else {
            this.logger.debug('Book ' + bookId + ' already in user ' + userId + ' library');
        }
    }
}
