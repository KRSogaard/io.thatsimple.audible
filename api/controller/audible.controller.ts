import { Response } from 'express-serve-static-core';
import { APILogger } from '../logger/api.logger';
import { User } from '../service/dal/user';
import { BookService } from '../service/dal/book';
import { SeriesService } from '../service/dal/series';
import { UserService } from '../service/dal/user';
import * as Queue from '../util/Queue.util';
import * as timeUtil from '../util/Time.util';

export class AudibleController {
  logger: APILogger;
  userService: UserService;
  seriesService: SeriesService;
  booksService: BookService;

  constructor() {
    this.logger = new APILogger('AudibleController');
    this.userService = new UserService();
    this.seriesService = new SeriesService();
    this.booksService = new BookService();
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
    this.logger.info('Getting all series with books for user ' + user.id);
    let userBooksIds = await this.booksService.getBooksIdsByUser(user.id);
    let series = await this.seriesService.getSeriesFromBooks(userBooksIds);
    let archivedSeries = await this.userService.getArchivedSeries(user.id);
    let response = [];

    if (series.length > 0) {
      let allBookIds = [];
      // we need to get all the book ids for the series wher the user has 1 or more books
      series.forEach((series) => {
        series.bookIds.forEach((bookId) => allBookIds.push(bookId));
      });
      let allBooks = await this.booksService.bulkGetBooks(allBookIds);

      await Promise.all(
        series.map(async (s) => {
          this.logger.trace("Getting series '" + s.name + "' with books");
          let books = allBooks.filter((b) => s.bookIds.includes(b.id));

          let uniqueTags = [];
          books.forEach((book) => {
            book.tags.forEach((tag) => {
              if (!uniqueTags.some((u) => u.id === tag.id)) {
                uniqueTags.push(tag);
              }
            });
          });

          let uniqueAuthors = [];
          books.forEach((book) => {
            book.authors.forEach((author) => {
              if (!uniqueAuthors.some((u) => u.id === author.id)) {
                uniqueAuthors.push(author);
              }
            });
          });

          let uniqueNarrators = [];
          books.forEach((book) => {
            book.narrators.forEach((narrator) => {
              if (!uniqueNarrators.some((u) => u.id === narrator.id)) {
                uniqueNarrators.push(narrator);
              }
            });
          });

          let uniquecategories = [];
          books.forEach((book) => {
            book.categories.forEach((category) => {
              if (!uniquecategories.some((u) => u.id === category.id)) {
                uniquecategories.push(category);
              }
            });
          });

          response.push({
            id: s.id,
            name: s.name,
            asin: s.asin,
            link: s.link,
            summary: s.summary,
            tags: uniqueTags,
            authors: uniqueAuthors,
            narrators: uniqueNarrators,
            categories: uniquecategories,
            books: books.map((b) => {
              return {
                id: b.id,
                asin: b.asin,
                title: b.title,
                link: b.link,
                length: b.length,
                summary: b.summary,
                released: b.released,
                authors: b.authors.map((a) => {
                  return { id: a.id, name: a.value };
                }),
                tags: b.tags.map((a) => {
                  return { id: a.id, tag: a.value };
                }),
                narrators: b.narrators.map((a) => {
                  return { id: a.id, name: a.value };
                }),
                categories: b.categories.map((a) => {
                  return { id: a.id, category: a.value };
                }),
              };
            }),
          });
        })
      );
    }
    res.status(200).send({ myBooks: userBooksIds, archivedSeries: archivedSeries, series: response });
  }
}
