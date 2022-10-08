import { APILogger } from '../logger/api.logger';
import * as moment from 'moment';
import StorageService from './storage.service';
import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import * as Parser from '../util/Parser.util';
import { AudibleBookService } from './book.service';
import { AudibleAuthorService } from './author.service';
import { AudibleCategoryService } from './category.service';
import { AudibleNarratorService } from './narrator.service';
import { AudibleSeriesService } from './series.service';
import { AudibleTagService } from './tag.service';
import { AudibleUserService } from './user.service';
import * as Queue from '../util/Queue.util';
import * as Download from '../util/Download.util';
import * as Transformer from '../util/Transformer.util';

export class AudibleManagementService {
  logger: APILogger;

  bookService: AudibleBookService;
  authorService: AudibleAuthorService;
  categoryService: AudibleCategoryService;
  narratorService: AudibleNarratorService;
  seriesService: AudibleSeriesService;
  tagService: AudibleTagService;
  userService: AudibleUserService;

  constructor() {
    this.logger = new APILogger();
    this.bookService = new AudibleBookService();
    this.authorService = new AudibleAuthorService();
    this.categoryService = new AudibleCategoryService();
    this.narratorService = new AudibleNarratorService();
    this.seriesService = new AudibleSeriesService();
    this.tagService = new AudibleTagService();
    this.userService = new AudibleUserService();
  }

  async downloadBook(url: string, force?: boolean, userId?: number): Promise<void> {
    this.logger.info('Resuest to download book from url: ' + url);
    let bookASIN = Parser.getAsin(url);
    if (!bookASIN) {
      throw new Error('Failed to parse book ASIN');
    }

    let bookId = null;
    let existingBook = await this.bookService.getBookASIN(bookASIN);
    let shouldDownload = this.shouldDownloadBook(existingBook, force ? true : false);
    if (shouldDownload) {
      let newBook = await this.downloadAndCreateBook(url);
      bookId = newBook.id;
    } else {
      bookId = existingBook.id;
    }

    if (userId) {
      this.logger.debug('Adding book to user: ' + userId);
      this.userService.addBookToUser(userId, bookId);
    } else {
      this.logger.debug('No user id provided, not adding book to user');
    }
  }

  shouldDownloadBook(book: AudibleBook, force: boolean): boolean {
    if (!book) {
      this.logger.debug('Book did not exist in the database, downloading');
      return true;
    }
    if (book.lastUpdated <= moment().subtract(1, 'month').toDate()) {
      this.logger.debug('Book was updated more than 1 month ago, downloading');
      return true;
    }
    if (force) {
      this.logger.debug('Book should be downloaded because force is true');
      return true;
    }
    this.logger.debug('No need to download the book');
    return false;
  }

  async downloadAndCreateBook(url: string): Promise<AudibleBook> {
    this.logger.trace('Downlaoding and create book from URL: ' + url);
    let html = await Download.downloadHtml(url);
    if (!html || html.length < 100) {
      throw new Error('Failed to download book html');
    }

    let book = Parser.parseBook(html);

    let newBook = await this.bookService.saveBook(Transformer.parseToAudibleBook(book));
    this.logger.debug('Created or updated new book with id: ' + newBook.id);

    if (newBook && book.image) {
      await this.downloadBookImage(newBook, book.image);
    }

    let bookId = newBook.id;

    this.logger.info('Book had ' + book.series.length + ' series');
    for (let series of book.series) {
      let savedSeries = await this.seriesService.saveSeries(Transformer.parseToAudibleSeries(series));
      await this.seriesService.addBookToSeries(bookId, savedSeries.id, series.bookNumber);

      await this.seriesService.setSeriesShouldDownload(savedSeries.id, true);
      await Queue.sendDownloadSeries(savedSeries.link);
    }

    this.logger.info('Book had ' + book.authors.length + ' authors');
    for (let author of book.authors) {
      let saveAuthor = await this.authorService.saveAuthor(author);
      await this.authorService.addBookToAuthor(bookId, saveAuthor.id);
    }

    this.logger.debug('Book had ' + book.tags.length + ' tags');
    for (let tag of book.tags) {
      await this.tagService.saveTag(bookId, tag);
    }

    this.logger.info('Book had ' + book.narrators.length + ' narrators');
    for (let narrator of book.narrators) {
      let saveNarrator = await this.narratorService.saveNarrator(narrator);
      await this.narratorService.addBookToNarrator(bookId, saveNarrator.id);
    }

    this.logger.info('Book had ' + book.categories.length + ' categories');
    for (let category of book.categories) {
      let saveCategory = await this.categoryService.saveCategory(category.name, category.link);
      await this.categoryService.addCategoryToBook(bookId, saveCategory.id);
    }

    return newBook;
  }

  async downloadBookImage(newBook: AudibleBook, url: string) {
    this.logger.debug('Downloading book image');
    let imageCheck = await StorageService.hasImage(newBook.asin);
    if (!imageCheck) {
      this.logger.debug('Downloading image for book ' + newBook.title);
      let image = await Download.downloadImage(url);
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
    if (storedSeries.lastUpdated < moment().subtract(1, 'month').toDate()) {
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

  async downloadSeries(url: string, force?: boolean): Promise<void> {
    this.logger.debug('Downloading series: ', url);

    let seriesASIN = Parser.getAsin(url);
    if (!seriesASIN) {
      throw new Error('Failed to parse series ASIN');
    }
    let storedSeries = await this.seriesService.getSeriesASIN(seriesASIN);
    let shouldDownload = this.shouldDownloadSeries(storedSeries, force ? true : false);

    if (shouldDownload) {
      this.logger.info('Downloading series');
      let html = await Download.downloadHtml(url);
      if (!html || html.length < 100) {
        throw new Error('Failed to download series html');
      }
      let parsedSeries = Parser.parseSeries(html);
      storedSeries = await this.seriesService.saveSeries(Transformer.parseToAudibleSeries(parsedSeries));
      this.logger.debug('Series ' + storedSeries.name + ' has ' + parsedSeries.books.length + ' books');

      for (let book of parsedSeries.books) {
        let savedBook = await this.bookService.getBookASIN(book.asin);
        if (savedBook === null) {
          this.logger.debug('Book ' + book.asin + ' not found in database, creating temp book');
          let bookId = await this.bookService.createTempBook(book.asin, book.link);
          await this.seriesService.addBookToSeries(bookId, storedSeries.id, book.bookNumber);
          await Queue.sendDownloadBook(book.link);
        } else {
          let series = savedBook.series.filter((s) => s.asin === storedSeries.asin);
          if (series.length === 0) {
            this.logger.debug('Adding book ' + savedBook.title, +' to series ' + storedSeries.name);
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

    this.logger.debug('Finished downloading series: ' + storedSeries.name);
  }
}

export default AudibleManagementService;
