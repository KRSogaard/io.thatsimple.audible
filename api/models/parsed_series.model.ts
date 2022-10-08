export interface ParseSeries {
  name: string;
  summary: string;
  link: string;
  asin: string;
  books: ParseSeriesBook[];
}

export interface ParseSeriesBook {
  bookNumber: string;
  asin: string;
  link: string;
  releaseDate?: Date;
  lengthSeconds?: number;
}
