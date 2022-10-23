import { Response } from 'express-serve-static-core';
import { APILogger } from '../logger/api.logger';
import { User } from '../models/user.model';
import { AudibleBookService } from '../service/book.service';
import { AudibleSeriesService } from '../service/series.service';
import { AudibleUserService } from '../service/user.service';
import * as Queue from '../util/Queue.util';
import * as timeUtil from '../util/Time.util';

export class AudibleController {
  logger: APILogger;
  userService: AudibleUserService;
  seriesService: AudibleSeriesService;
  booksService: AudibleBookService;

  constructor() {
    this.logger = new APILogger();
    this.userService = new AudibleUserService();
    this.seriesService = new AudibleSeriesService();
    this.booksService = new AudibleBookService();
  }

  async requestBookDownload(user: User, bookUrl: string, res: Response<any, Record<string, any>, number>) {
    // Trying to get title from url
    let urlSplit = bookUrl.split('?')[0].split('/');
    urlSplit.pop(); // thow out the last part of the url as it is the asin
    let title = urlSplit.pop()?.replace('-Audiobook', '').replace(/-/g, ' ');

    let jobId = await this.userService.createJob(
      user.id,
      'book',
      JSON.stringify({
        asin: bookUrl.split('?')[0].split('/').pop(),
        link: bookUrl.split('?')[0],
        title: title ? title : 'Unknown title',
      })
    );
    await Queue.sendDownloadBook(bookUrl, jobId, user.id, true);
    res.status(200).send({ message: 'Book download request received' });
  }

  async getSeriesWithBooks(user: User, res: Response<any, Record<string, any>, number>) {
    this.logger.info('Getting series where the user has books: ' + user.id);
    let userBooksIds = await this.booksService.getBooksIdsByUser(user.id);
    let series = await this.seriesService.getSeriesFromBooks(userBooksIds);
    let archivedSeries = await this.userService.getArchivedSeries(user.id);
    let response = [];
    await Promise.all(
      series.map(async (s) => {
        this.logger.debug("Getting series '" + s.name + "' with books");
        let books = await this.booksService.bulkGetBooks(s.bookIds);
        response.push({
          id: s.id,
          name: s.name,
          asin: s.asin,
          link: s.link,
          summary: s.summary,
          books: books.map((b) => {
            return {
              id: b.id,
              asin: b.asin,
              title: b.title,
              link: b.link,
              length: b.length,
              summary: b.summary,
              released: timeUtil.datetoTimestamp(b.released),
              authors: b.authors,
              tags: b.tags,
              narrators: b.narrators,
            };
          }),
        });
      })
    );
    res.status(200).send({ myBooks: userBooksIds, archivedSeries: archivedSeries, series: response });
  }
}
