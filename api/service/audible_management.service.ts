import { APILogger } from '../logger/api.logger';
import * as moment from 'moment';
import StorageService from './storage.service';
import { AudibleBook, AudibleSeries } from './dal/models';
import * as Parser from './audibleParser';
import { BookService } from './dal/book';
import { AuthorService } from './dal/author';
import { CategoryService } from './dal/category';
import { NarratorService } from './dal/narrator';
import { SeriesService } from './dal/series';
import { TagService } from './dal/tag';
import { UserService } from './dal/user';
import * as Queue from '../util/Queue.util';
import * as AsyncTools from '../util/Async.util';
import * as TimeUtil from '../util/Time.util';
import { DownloadService } from '../service/download';

export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';

    Object.setPrototypeOf(this, RetryableError.prototype);
  }
}

export class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FatalError';

    Object.setPrototypeOf(this, FatalError.prototype);
  }
}

export class AudibleManagementService {
  logger: APILogger;
  downloadService: DownloadService;
  bookService: BookService;
  authorService: AuthorService;
  categoryService: CategoryService;
  narratorService: NarratorService;
  seriesService: SeriesService;
  tagService: TagService;
  userService: UserService;

  constructor(downloadService: DownloadService) {
    this.logger = new APILogger('AudibleManagementService');
    this.downloadService = downloadService;
    this.bookService = new BookService();
    this.authorService = new AuthorService();
    this.categoryService = new CategoryService();
    this.narratorService = new NarratorService();
    this.seriesService = new SeriesService();
    this.tagService = new TagService();
    this.userService = new UserService();
  }

  async downloadBook(url: string, userId: number | null, addToUser: boolean, force?: boolean): Promise<boolean> {
    let hitAudibleUrl = false;

    this.logger.info('Request to download book from url: ' + url);
    let bookASIN = Parser.getAsin(url);
    if (!bookASIN) {
      throw new Error('Failed to parse book ASIN');
    }

    let bookId = null;
    let existingBook = await this.bookService.getBookASIN(bookASIN);
    let shouldDownload = this.shouldDownloadBook(existingBook, force ? true : false);
    if (shouldDownload) {
      let newBookReponse = await this.downloadAndCreateBook(url, userId);
      if (!newBookReponse || !newBookReponse.onlyUsedCache) {
        hitAudibleUrl = true;
      }
      if (!newBookReponse) {
        this.logger.warn('Can not continue because the book could not be downloaded');
        return true;
      }

      let newBook = newBookReponse.data;
      if (!newBook) {
        this.logger.error('Failed to download book, skipping');
        return;
      }
      bookId = newBook.id;
    } else {
      bookId = existingBook.id;
    }

    if (userId && addToUser) {
      this.logger.debug('Adding book to user: ' + userId);
      this.userService.addBookToUser(bookId, userId);
    } else {
      this.logger.debug('No user id provided, not adding book to user');
    }

    this.logger.info('Finished downloading book ' + url);
    return hitAudibleUrl;
  }

  async shouldDownloadBook(book: AudibleBook, force: boolean): Promise<boolean> {
    if (!book) {
      this.logger.debug('Book did not exist in the database, downloading');
      return true;
    }
    // is the book last updated older than 1 month (2,628,288)?
    if (book.lastUpdated <= TimeUtil.getNowTimestamp() - 2628288) {
      this.logger.debug('Book was updated more than 1 month ago, downloading');
      return true;
    }
    if (!book.title) {
      this.logger.debug('Book did not have a title, downloading');
      return true;
    }
    if (force) {
      this.logger.debug('Book should be downloaded because force is true');
      return true;
    }

    // We should check if we already have the image, if not, download it
    let imageCheck = await StorageService.hasImage(book.asin);
    if (!imageCheck) {
      this.logger.debug('Book is missing the image, we need to re-download');
      return true;
    }

    this.logger.debug('No need to download the book');
    return false;
  }

  async downloadAndCreateBook(url: string, userId: number | null): Promise<CachedResponse<AudibleBook> | null> {
    let hitAudibleUrl = false;

    this.logger.debug('Downlaoding and create book from URL: ' + url);
    let downloadReponse = await this.downloadService.downloadHtml(url);
    if (!downloadReponse || downloadReponse.status !== 200) {
      this.logger.warn('Failed to download book retrying after 1 sek: ' + url);
      await AsyncTools.delay(1000);
      downloadReponse = await this.downloadService.downloadHtml(url);
    }
    if (!downloadReponse || (downloadReponse && downloadReponse.status === 500)) {
      this.logger.warn('Download returned 500 error: ' + url);
      throw new RetryableError('500 error while downloading book');
    }
    if (downloadReponse && downloadReponse.status === 404) {
      this.logger.warn('Book no longer exists, skipping download');
      return null;
    }
    let html = downloadReponse.data;
    if (!html || html.length < 100) {
      this.logger.error('Failed to download book from url: ' + url);
      throw new RetryableError('Failed to download book html');
    }
    if (!downloadReponse.cached) {
      hitAudibleUrl = true;
    }

    let start = Date.now();
    let book = Parser.parseBook(html);
    this.logger.debug('Parsing book took: ' + (Date.now() - start) + 'ms');
    if (!book) {
      throw new FatalError('Book can not be parsed, was it a preorder?');
    }
    start = Date.now();
    let newBook = await this.bookService.saveBook(book.asin, book.link, book.title, book.runtime, book.released, book.summary);
    this.logger.debug('Created or updated new book with id: ' + newBook.id + ' in ' + (Date.now() - start) + 'ms');

    if (newBook && book.image) {
      start = Date.now();
      await this.downloadImageWithRetry(newBook, book.image);
      this.logger.debug('Downloaded book image in: ' + (Date.now() - start) + 'ms');
    }

    let bookId = newBook.id;

    this.logger.debug(
      'Book had ' +
        book.series.length +
        ' series, ' +
        book.authors.length +
        ' authors, ' +
        book.tags.length +
        ' tags, ' +
        book.narrators.length +
        ' narrators, ' +
        book.categories.length +
        ' categories'
    );
    for (let series of book.series) {
      let savedSeries = await this.seriesService.saveOrGetSeries(series.asin, series.name, series.link, series.summary);
      await this.seriesService.addBookToSeries(bookId, savedSeries.id, series.bookNumber);

      await this.seriesService.setSeriesShouldDownload(savedSeries.id, true);
      let jobId = userId
        ? await this.userService.createJob(
            userId,
            'series',
            JSON.stringify({
              name: savedSeries.name,
              asin: savedSeries.asin,
              link: savedSeries.link,
            })
          )
        : null;
      await Queue.sendDownloadSeries(savedSeries.link, jobId, userId ? userId : null);
    }

    for (let author of book.authors) {
      let saveAuthor = await this.authorService.saveOrGetAuthor(author.name, author.asin, author.link);
      await this.authorService.addBookToAuthor(bookId, saveAuthor);
    }

    for (let tag of book.tags) {
      let savedTag = await this.tagService.saveOrGetTag(tag);
      await this.tagService.addTagToBook(bookId, savedTag);
    }

    for (let narrator of book.narrators) {
      let saveNarrator = await this.narratorService.saveNarrator(narrator);
      await this.narratorService.addBookToNarrator(bookId, saveNarrator);
    }

    for (let category of book.categories) {
      let saveCategory = await this.categoryService.saveOrGetCategory(category.name, category.link);
      await this.categoryService.addCategoryToBook(bookId, saveCategory);
    }

    return {
      onlyUsedCache: !hitAudibleUrl,
      data: newBook,
    };
  }

  async downloadImageWithRetry(book: AudibleBook, url: string) {
    try {
      await this.downloadBookImage(book, url);
    } catch (e) {
      // We are going to try again one time, else we will throw the error
      if (e instanceof RetryableError) {
        await this.downloadBookImage(book, url);
      } else {
        throw e;
      }
    }
  }

  async downloadBookImage(newBook: AudibleBook, url: string) {
    this.logger.debug('Downloading book image');
    let imageCheck = await StorageService.hasImage(newBook.asin);
    if (!imageCheck) {
      this.logger.debug('Downloading image for book ' + newBook.title);
      let image = await this.downloadService.downloadImage(url);
      await StorageService.saveImage(newBook.asin, image);
    } else {
      this.logger.debug('Image already exists for book ' + newBook.title);
    }
  }

  shouldDownloadSeries(storedSeries: AudibleSeries, force: boolean): boolean {
    if (!storedSeries) {
      this.logger.debug('Series should be downloaded because it is not in the database');
      return true;
    }

    // is the book last updated older than 1 week (604,800)?
    if (storedSeries.lastUpdated <= TimeUtil.getNowTimestamp() - 604800) {
      this.logger.debug('Series should be downloaded because it is older than 1 month');
      return true;
    }
    if (storedSeries.summary === null || storedSeries.summary === '') {
      this.logger.debug('Series should be downloaded because it has no summary');
      return true;
    }
    if (force) {
      this.logger.debug('Series should be downloaded because force is true');
      return true;
    }
    this.logger.debug('Series should not be downloaded');
    return false;
  }

  async downloadSeries(url: string, userId: number, force?: boolean): Promise<boolean> {
    let hitAudibleUrl = false;
    this.logger.debug('Downloading series: ' + url);

    let seriesASIN = Parser.getAsin(url);
    if (!seriesASIN) {
      throw new Error('Failed to parse series ASIN');
    }
    let storedSeries = await this.seriesService.getSeriesASIN(seriesASIN);
    let shouldDownload = this.shouldDownloadSeries(storedSeries, force ? true : false);

    if (shouldDownload) {
      this.logger.info('Downloading series');
      let downloadReponse = await this.downloadService.downloadHtml(url);
      if (!downloadReponse || downloadReponse.status !== 200) {
        this.logger.warn('Failed to download series retrying after 1 sek: ' + url);
        await AsyncTools.delay(1000);
        downloadReponse = await this.downloadService.downloadHtml(url);
      }
      if (downloadReponse && downloadReponse.status === 404) {
        this.logger.warn('Series no longer exists, skipping download');
        return true;
      }
      if (!downloadReponse || downloadReponse.status !== 200) {
        throw new Error('Failed to download series html');
      }

      if (!downloadReponse.cached) {
        hitAudibleUrl = true;
      }

      let html = downloadReponse.data;
      if (!html || html.length < 100) {
        throw new Error('Failed to download series html');
      }
      let start = Date.now();
      let parsedSeries = Parser.parseSeries(html);
      this.logger.debug('Parsing series took ' + (Date.now() - start) + ' ms');
      storedSeries = await this.seriesService.saveOrGetSeries(parsedSeries.asin, parsedSeries.name, parsedSeries.link, parsedSeries.summary);
      this.logger.debug('Series ' + storedSeries.name + ' has ' + parsedSeries.books.length + ' books');

      for (let book of parsedSeries.books) {
        // Left this here to catch if any new issues pop up
        if (book && book.link === 'https://www.audible.comundefined') {
          throw new FatalError('Undefined book link from series');
        }

        let savedBook = await this.bookService.getBookASIN(book.asin);
        if (savedBook === null) {
          this.logger.debug('Book ' + book.asin + ' not found in database, creating temp book');
          let bookId = await this.bookService.createTempBook(book.asin, book.link);
          await this.seriesService.addBookToSeries(bookId, storedSeries.id, book.bookNumber);
          if (!book.link) {
            this.logger.debug('Book ' + book.asin + ' did not have a link, adding to download queue');
          }
          let jobId = userId
            ? await this.userService.createJob(
                userId,
                'book',
                JSON.stringify({
                  asin: book.asin,
                  link: book.link,
                  title: book.title,
                })
              )
            : null;
          await Queue.sendDownloadBook(book.link, jobId, userId ? userId : null, false);
        } else {
          let series = savedBook.series.filter((s) => s.asin === storedSeries.asin);
          if (series.length === 0) {
            this.logger.debug('Adding book ' + savedBook.title + ' to series ' + storedSeries.name);
            await this.seriesService.addBookToSeries(savedBook.id, storedSeries.id, book.bookNumber);
          } else {
            this.logger.debug('Book ' + savedBook.title + ' already exists in series: ' + savedBook.asin);
            if (book.bookNumber != null && book.bookNumber.length > 0 && series[0].bookNumber !== book.bookNumber) {
              this.logger.debug('Updating book number for book: ' + savedBook.title + ' with number ' + book.bookNumber);
              await this.seriesService.updateBookSeries(savedBook.id, series[0].id, book.bookNumber);
            }
          }
        }
      }
    }

    this.logger.info('Finished downloading series: ' + storedSeries.name);
    return hitAudibleUrl;
  }
}

export interface CachedResponse<T> {
  onlyUsedCache: boolean;
  data: T;
}

export default AudibleManagementService;
