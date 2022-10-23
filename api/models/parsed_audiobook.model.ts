interface ParseAudioBook {
  title: string;
  asin: string;
  released: number;
  link: string;
  image: string;
  subtitle?: string;
  authors: ParseAudioBookPerson[];
  narrators: string[];
  runtime: number;
  summary: string;
  series?: ParseAudioBookSeries[];
  categories: ParseAudioBookCategory[];
  tags: string[];
}

export interface ParseAudioBookPerson {
  name: string;
  link: string;
  asin: string;
}
export interface ParseAudioBookSeries {
  name: string;
  link: string;
  asin: string;
  bookNumber?: string | null;
  summary?: string | null;
}
export interface ParseAudioBookCategory {
  name: string;
  link: string;
  id: string;
}

export default ParseAudioBook;
