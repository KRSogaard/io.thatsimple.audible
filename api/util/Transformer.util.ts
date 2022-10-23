import { AudibleBook, AudibleSeries, AudibleAuthor, AudibleSeriesBook, AudibleNarrator, AudibleCategory } from '../models/audiblebook.model';
import ParseAudioBook, { ParseAudioBookSeries } from '../models/parsed_audiobook.model';
import { ParseSeries } from '../models/parsed_series.model';

export const parseToAudibleBook = (book: ParseAudioBook): AudibleBook => {
  return {
    asin: book.asin,
    link: book.link,
    title: book.title,
    length: book.runtime,
    released: new Date(book.released * 1000),
    summary: book.summary,
    series: book.series.map((s): AudibleSeriesBook => {
      return {
        asin: s.asin,
        link: s.link,
        name: s.name,
        summary: s.summary,
        bookNumber: s.bookNumber,
      };
    }),
    authors: book.authors.map((a): AudibleAuthor => {
      return {
        asin: a.asin,
        link: a.link,
        name: a.name,
      };
    }),
    tags: book.tags,
    narrators: book.narrators.map((n): AudibleNarrator => {
      return {
        name: n,
      };
    }),
    categories: book.categories.map((c): AudibleCategory => {
      return {
        name: c.name,
        link: c.link,
      };
    }),
  };
};

export const parseToAudibleSeries = (series: ParseAudioBookSeries | ParseSeries): AudibleSeries => {
  return {
    asin: series.asin,
    link: series.link,
    name: series.name,
    summary: series.summary ? series.summary : null,
  };
};
