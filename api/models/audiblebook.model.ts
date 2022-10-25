export interface AudibleBook {
  id?: number;
  asin: string;
  link: string;
  title: string;
  length: number;
  released: Date;
  summary: string;
  lastUpdated?: Date;
  series?: AudibleSeriesBook[];
  authors?: AudibleAuthor[];
  tags?: AudibleTag[];
  narrators?: AudibleNarrator[];
  categories?: AudibleCategory[];
}

export interface AudibleSeries {
  id?: number;
  asin: string;
  link: string;
  summary: string;
  name: string;
  lastUpdated?: Date;
  created?: Date;
  shouldDownload?: boolean;
}

export interface AudibleSeriesBook {
  id?: number;
  asin: string;
  link?: string;
  summary?: string;
  name: string;
  bookNumber: string;
  created?: Date;
}

export interface AudibleAuthor {
  id?: number;
  asin: string;
  link: string;
  name: string;
  created?: Date;
}

export interface AudibleNarrator {
  id?: number;
  name: string;
  created?: Date;
}

export interface AudibleCategory {
  id?: number;
  name: string;
  link: string;
  created?: Date;
}

export interface AudibleSeriesWithBooks extends AudibleSeries {
  bookIds: number[];
}

export interface AudibleTag {
  id?: number;
  tag: string;
  created?: Date;
}
