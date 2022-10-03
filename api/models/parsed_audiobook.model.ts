interface ParseAudioBook {
  title: string;
  amazon_id: string;
  link: string;
  subtitle?: string;
  authors: ParseAudioBookPerson[];
  narrators: ParseAudioBookPerson[];
  runtime: number;
  summary: string;
  series?: ParseAudioBookSeries;
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
}
export interface ParseAudioBookCategory {
  name: string;
  link: string;
  id: string;
}

export default ParseAudioBook;
