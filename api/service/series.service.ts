import { APILogger } from '../logger/api.logger';
import {
  AudibleBook,
  AudibleSeries,
  AudibleAuthor,
  AudibleSeriesBook,
  AudibleNarrator,
  AudibleCategory,
  AudibleSeriesWithBooks,
} from '../models/audiblebook.model';
import * as mysql from '../util/MySQL.util';
import * as timeUtil from '../util/Time.util';

export class AudibleSeriesService {
  public logger: APILogger;

  constructor() {
    this.logger = new APILogger();
  }

  async setSeriesShouldDownload(seriesId: number, shouldDownload: boolean) {
    let sql = 'UPDATE `series` SET `should_download` = ? WHERE `id` = ?';
    await mysql.runQuery(sql, [shouldDownload, seriesId]);
  }

  async getSeries(id: string): Promise<AudibleSeries> {
    let sql = 'SELECT * FROM `series` ' + 'WHERE `series`.id = ?';
    let results = await mysql.runQuery(sql, [id]);
    return this.parseSeriesResults(results);
  }

  async getSeriesASIN(asin: string): Promise<AudibleSeries> {
    let sql = 'SELECT * FROM `series` ' + 'WHERE `series`.asin = ?';
    let results = await mysql.runQuery(sql, [asin]);
    return this.parseSeriesResults(results);
  }

  parseSeriesResults(results: any): AudibleSeries {
    if (!results || results.length === 0) {
      return null;
    }
    return this.parseSeriesResult(results[0]);
  }

  parseSeriesResult(result: any): AudibleSeries {
    return {
      id: result.id,
      name: result.name,
      asin: result.asin,
      link: result.link,
      summary: result.summary,
      lastUpdated: timeUtil.dateFromTimestamp(result.last_updated),
      shouldDownload: result.should_download === 1,
      created: timeUtil.dateFromTimestamp(result.created),
    };
  }

  async saveSeries(series: AudibleSeries): Promise<AudibleSeries> {
    this.logger.info('Saving series: ' + series.name);
    let check = await this.getSeriesASIN(series.asin);
    if (check || (check && check.shouldDownload)) {
      this.logger.debug('Series ' + series.name + ' already exists');

      if (series.summary && series.summary.length > 0 && series.summary !== check.summary) {
        this.logger.info('Updating series ' + series.name + ' summary');
        let sql = 'UPDATE `series` SET `summary` = ? WHERE `id` = ?';
        await mysql.runQuery(sql, [series.summary, check.id]);
      }

      return check;
    }
    this.logger.debug('Series did not exists, creating new with ASIN: ' + series.asin);
    let sql = 'INSERT INTO `series` (`asin`, `link`, `name`, `last_updated`, `summary`, `created`, `should_download`) VALUES (?, ?, ?, ?, ?, ?, ?);';
    await mysql.runQuery(sql, [
      series.asin,
      series.link,
      series.name,
      Math.round(Date.now() / 1000),
      series.summary ? series.summary : null,
      Math.round(Date.now() / 1000),
      0,
    ]);
    return await this.getSeriesASIN(series.asin);
  }

  async addBookToSeries(bookId: number, seriesId: number, bookNumber: string): Promise<any> {
    this.logger.debug('Adding book ' + bookId + ' to series ' + seriesId + ' with book number ' + bookNumber);

    let sql = 'SELECT * FROM `series_books` WHERE `book_id` = ? AND `series_id` = ?';
    let results = await mysql.runQuery(sql, [bookId, seriesId]);
    if (!results || results.length === 0) {
      let sql = 'INSERT INTO `series_books` (`book_id`, `series_id`, `book_number`, `created`) VALUES (?, ?, ?, ?);';
      if (!bookNumber || bookNumber === '') {
        bookNumber = null;
      }
      await mysql.runQuery(sql, [bookId, seriesId, bookNumber, Math.round(Date.now() / 1000)]);
    } else {
      this.logger.debug('Book ' + bookId + ' already in series ' + seriesId);
      if (bookNumber != null && bookNumber !== '' && results[0].book_number !== bookNumber) {
        this.logger.debug('Updating book ' + bookId + ' in series ' + seriesId + '  to have book number ' + bookNumber);
        let sql = 'UPDATE `series_books` SET `book_number` = ? WHERE `book_id` = ? AND `series_id` = ?';
        await mysql.runQuery(sql, [bookNumber, bookId, seriesId]);
      }
    }
    await this.updateSeries(seriesId);
  }

  async updateBookSeries(bookId: number, seriesId: number, bookNumber: string): Promise<any> {
    this.logger.info('Updating book number for book ' + bookId + ' in series ' + seriesId + ' with number ' + bookNumber);
    let sql = 'UPDATE `series_books` SET `book_number` = ? WHERE `book_id` = ? AND `series_id` = ?';
    await mysql.runQuery(sql, [bookNumber, bookId, seriesId]);
  }

  async updateSeries(seriesId: number) {
    if (!seriesId) {
      throw Error('No series id provided');
    }
    this.logger.debug('Updating series ' + seriesId + ' last updated time');
    let sql = 'UPDATE `series` SET `last_updated` = ? WHERE `id` = ?';
    await mysql.runQuery(sql, [Math.round(Date.now() / 1000), seriesId]);
  }

  async getSeriesFromBooks(bookIds: number[]): Promise<AudibleSeriesWithBooks[]> {
    if (!bookIds || bookIds.length === 0) {
      return [];
    }
    let sql = 'SELECT * FROM `series` AS s WHERE (SELECT COUNT(*) FROM `series_books` WHERE series_id = s.id AND book_id IN (?))';
    let results = await mysql.runQuery(sql, [bookIds]);
    let series: AudibleSeriesWithBooks[] = [];
    await Promise.all(
      results.map(async (result: any) => {
        let s = this.parseSeriesResult(result) as AudibleSeriesWithBooks;
        s.bookIds = await this.getBookIdsForSeries(s.id);
        series.push(s);
      })
    );
    return series;
  }

  async getBookIdsForSeries(seriesId: number): Promise<number[]> {
    let sql = 'SELECT * FROM `series_books` WHERE `series_id` = ?';
    let results = await mysql.runQuery(sql, [seriesId]);
    return results.map((result: any) => {
      return result.book_id;
    });
  }
}
