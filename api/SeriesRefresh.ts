import { APILogger } from './logger/api.logger';
import * as Queue from './util/Queue.util';
import { SeriesService } from './service/dal/series';
import { delay } from './util/Async.util';
import { BookService } from './service/dal/book';

const daysOld = 7;
const waitTime = 2000;
const logger = new APILogger('SeriesRefresh');

export const SeriesRefresh = async (): Promise<void> => {
  logger.info('Refreshing series that has not been updated in ' + daysOld + ' days');
  let seriesService = new SeriesService();
  let bookService = new BookService();

  // Sleeping 5 sek to make sure everything is up and running
  await delay(5000);

  while (true) {
    try {
      let series = await seriesService.getSeriesOrlderThen(daysOld);
      if (series.length > 0) {
        logger.info('Found ' + series.length + ' series to refresh');
        for (let i = 0; i < series.length; i++) {
          let s = series[i];
          logger.info('Refreshing series: ' + s.name);
          await Queue.sendDownloadSeries(s.link, null, null, true);
        }
      }

      let books = await bookService.getUnfinishedTempBooks();
      if (books.length > 0) {
        logger.info('Found ' + books.length + ' unfinished books to refresh');
        for (let i = 0; i < books.length; i++) {
          let b = books[i];
          logger.info('Finishing book: ' + b.title);
          await Queue.sendDownloadBook(b.link, null, null, true);
        }
      }
    } catch (error) {
      logger.error('Failed to process series updated: ' + error.message);
    }
    await delay(waitTime);
  }
};
