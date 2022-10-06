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
  tags?: string[];
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
  shouldDownload?: boolean;
}

export interface AudibleSeriesBook extends AudibleSeries {
  bookNumber: string;
}

export interface AudibleAuthor {
  id?: number;
  asin: string;
  link: string;
  name: string;
}

export interface AudibleNarrator {
  id?: number;
  name: string;
}

export interface AudibleCategory {
  id?: number;
  name: string;
  link: string;
}
