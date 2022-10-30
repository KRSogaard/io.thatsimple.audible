export interface BulkAudibleBook {
  id: number;
  asin: string;
  link: string;
  title: string;
  length: number;
  released: number;
  summary: string;
  lastUpdated?: Date;
  series: SimpleSeries[];
  authors: IdValueInfo[];
  tags: IdValueInfo[];
  narrators: IdValueInfo[];
  categories: IdValueInfo[];
}

export interface IdValueInfo {
  id: number;
  value: string;
}

export interface AudibleBook {
  id: number;
  asin: string;
  link: string;
  title: string;
  length: number;
  released: number;
  summary: string;
  lastUpdated: number;
  series: SimpleSeries[];
  authors: AudibleAuthor[];
  tags: AudibleTag[];
  narrators: AudibleNarrator[];
  categories: AudibleCategory[];
}

export interface SimpleSeries {
  id: number;
  asin: string;
  link: string;
  name: string;
  bookNumber: string;
}

export interface AudibleAuthor {
  id: number;
  asin: string;
  link: string;
  name: string;
  created: number;
}

export interface AudibleNarrator {
  id: number;
  name: string;
  created: number;
}

export interface AudibleCategory {
  id: number;
  name: string;
  link: string;
  created: number;
}

export interface AudibleTag {
  id: number;
  tag: string;
  created: number;
}

export interface AudibleSeries {
  id: number;
  asin: string;
  link: string;
  summary: string;
  name: string;
  lastUpdated: number;
  created: number;
}

export interface AudibleSeriesWithBooks extends AudibleSeries {
  bookIds: number[];
}
