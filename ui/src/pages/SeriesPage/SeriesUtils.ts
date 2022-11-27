import { MyData, SeriesDataResponse } from '../../services/AudibleService';

export interface SortedSeries {
  allSeries: SeriesDataResponse[];
  activeSeries: SeriesDataResponse[];
  completeSeries: SeriesDataResponse[];
  archivedSeries: SeriesDataResponse[];
  myBooks: number[];
}

export function sortSeries(myData: MyData) {
  let activeSeries: SeriesDataResponse[] = [];
  let completeSeries: SeriesDataResponse[] = [];
  let archivedSeries: SeriesDataResponse[] = [];
  let allSeries: SeriesDataResponse[] = [];

  if (myData && myData.series) {
    allSeries = myData.series;
    myData.series.forEach((s: SeriesDataResponse) => {
      if (myData.archivedSeries.some((match: number) => match === s.id)) {
        archivedSeries.push(s);
      } else {
        if (s.books.filter((b) => !myData.myBooks.some((match) => match === b.id)).length === 0) {
          completeSeries.push(s);
        } else {
          activeSeries.push(s);
        }
      }
    });
  }

  return {
    allSeries: allSeries,
    activeSeries: activeSeries,
    completeSeries: completeSeries,
    archivedSeries: archivedSeries,
    myBooks: myData.myBooks,
  };
}
