import { useState, useEffect } from 'react';
import AudibleService, { SeriesDataResponse } from '../../services/AudibleService';
import Show from './components/Show';

function SeriesPage() {
  const [myBooks, setMyBooks] = useState<number[]>([]);
  const [archived, setArchived] = useState<number[]>([]);
  const [allSeries, setAllSeries] = useState<SeriesDataResponse[]>([]);
  const [series, setSeries] = useState<SeriesDataResponse[]>([]);
  const [completedSeries, setCompletedSeries] = useState<SeriesDataResponse[]>([]);
  const [archivedSeries, setArchivedSeries] = useState<SeriesDataResponse[]>([]);
  const [loading, setLoading] = useState(true);
  let callActive = false;

  useEffect(() => {
    console.log('useEffect');
    async function fetchData() {
      if (callActive) {
        // to prevent double calls
        return;
      }
      callActive = true;
      setLoading(true);
      if (!AudibleService.isAuthenticated()) {
        console.log('not authenticated');
        return;
      }

      console.log('Calling to get data');
      const myData = await AudibleService.getMyData();
      setMyBooks(myData.myBooks);
      setAllSeries(myData.series);
      setArchived(myData.archivedSeries);
      setLoading(false);
      callActive = false;
    }
    fetchData();
  }, []);

  useEffect(() => {
    sortSeries();
  }, [allSeries, myBooks, archived]);

  const isArchived = (seriesId: number): boolean => {
    return archived.some((s: number) => s === seriesId);
  };

  const isMyBook = (bookId: number): boolean => {
    return myBooks.some((b) => b === bookId);
  };

  const sortSeries = () => {
    let activeSeries: SeriesDataResponse[] = [];
    let completeSeries: SeriesDataResponse[] = [];
    let archivedSeries: SeriesDataResponse[] = [];

    allSeries.forEach((s: SeriesDataResponse) => {
      if (isArchived(s.id)) {
        archivedSeries.push(s);
      } else {
        if (s.books.filter((b) => !isMyBook(b.id)).length === 0) {
          completeSeries.push(s);
        } else {
          activeSeries.push(s);
        }
      }
    });

    setSeries(activeSeries);
    setArchivedSeries(archivedSeries);
    setCompletedSeries(completeSeries);
  };

  const changeArchiveStatus = async (seriesId: number, archived: boolean): Promise<void> => {
    setLoading(true);
    let selectedSeries = null;
    if (archived) {
      let seriesFilter = series.filter((s) => s.id === seriesId);
      if (seriesFilter.length < 1) {
        seriesFilter = completedSeries.filter((s) => s.id === seriesId);
      }
      if (seriesFilter.length < 1) {
        console.log('Could not find series', seriesId);
        return;
      }
      selectedSeries = seriesFilter[0];
      AudibleService.archiveSeries(seriesId);
      setSeries(series.filter((s) => s.id !== seriesId));
      setCompletedSeries(completedSeries.filter((s) => s.id !== seriesId));
      setArchivedSeries([...archivedSeries, selectedSeries]);
    } else {
      let seriesFilter = archivedSeries.filter((s) => s.id === seriesId);
      if (seriesFilter.length < 1) {
        console.log('Was unable to find the seires');
        return;
      }
      selectedSeries = seriesFilter[0];
      AudibleService.unarchiveSeries(seriesId);
      setArchivedSeries(archivedSeries.filter((s) => s.id !== seriesId));
      if (selectedSeries.books.filter((b) => !myBooks.includes(b.id)).length === 0) {
        setCompletedSeries([...completedSeries, selectedSeries]);
      } else {
        setSeries([...series, selectedSeries]);
      }
    }
    setLoading(false);
  };

  return <Show active={series} completed={completedSeries} archived={archivedSeries} loading={loading} myBooks={myBooks} onArchive={changeArchiveStatus} />;
}

export default SeriesPage;
