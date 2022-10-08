import { APILogger } from '../logger/api.logger';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/time.util';

export class AudibleAuthorService {
    public logger: APILogger;

    constructor() {
        this.logger = new APILogger();
    }

    async saveAuthor(author: AudibleAuthor): Promise<AudibleAuthor> {
        this.logger.info('Saving author: ' + author.name);
        let check = await this.getAuthorASIN(author.asin);
        if (check) {
            this.logger.info('Author ' + author.name + ' already exists');
            return check;
        }
        let sql = 'INSERT INTO `authors` (`name`, `asin`, `link`, `created`) VALUES (?, ?, ?, ?);';
        let saveResult = await mysql.runQuery(sql, [author.name, author.asin, author.link, Math.round(Date.now() / 1000)]);
        return await this.getAuthor(saveResult.insertId);
    }

    async getAuthor(id: number): Promise<AudibleAuthor> {
        this.logger.debug('Getting author by id: ' + id);
        let sql = 'SELECT * FROM `authors` WHERE `id` = ?';
        let results = await mysql.runQuery(sql, [id]);
        return this.parseAuthorResult(results);
    }

    async getAuthorASIN(asin: string): Promise<AudibleAuthor> {
        this.logger.debug('Getting author by ASIN:' + asin);
        let sql = 'SELECT * FROM `authors` WHERE `asin` = ?';
        let results = await mysql.runQuery(sql, [asin]);
        return this.parseAuthorResult(results);
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
        };
    }

    async addBookToAuthor(bookId: number, authorId: number): Promise<void> {
        this.logger.info('Adding book ' + bookId + ' to author ' + authorId);
        let sql = 'SELECT * FROM `books_authors` WHERE `book_id` = ? AND `author_id` = ?';
        let results = await mysql.runQuery(sql, [bookId, authorId]);
        if (!results || results.length === 0) {
            sql = 'INSERT INTO `books_authors` (`book_id`, `author_id`, `created`) VALUES (?, ?, ?);';
            await mysql.runQuery(sql, [bookId, authorId, Math.round(Date.now() / 1000)]);
        } else {
            this.logger.debug('Book ' + bookId + ' already in author ' + authorId);
        }
    }
}
