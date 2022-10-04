interface ParseAudioBook {
  title: string;
  amazon_id: string;
  released: number;
  link: string;
  image: string;
  subtitle?: string;
  authors: ParseAudioBookPerson[];
  narrators: string[];
  runtime: number;
  summary: string;
  series?: ParseAudioBookSeries[];
  category: ParseAudioBookCategory;
  tags: string[];
}

export interface ParseAudioBookPerson {
  name: string;
  link: string;
}
export interface ParseAudioBookSeries {
  name: string;
  link: string;
  id: string;
  bookNumber?: string | null;
}
export interface ParseAudioBookCategory {
  name: string;
  link: string;
  id: string;
}

export default ParseAudioBook;
