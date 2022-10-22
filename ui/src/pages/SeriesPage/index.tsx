import React, { useState, useEffect } from 'react';
import AudibleService, { SeriesDataResponse } from '../../services/AudibleService';
import Show from './components/Show';

function SeriesPage() {
  const [showType, setShowType] = useState(1);
  const [myBooks, setMyBooks] = useState<number[]>([]);
  const [archived, setArchived] = useState<number[]>([]);
  const [allSeries, setAllSeries] = useState<SeriesDataResponse[]>([]);
  const [series, setSeries] = useState<SeriesDataResponse[]>([]);
  const [completedSeries, setCompletedSeries] = useState<SeriesDataResponse[]>([]);
  const [archivedSeries, setArchivedSeries] = useState<SeriesDataResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (!AudibleService.isAuthenticated()) {
        console.log('not authenticated');
        return;
      }

      const myData = await AudibleService.getMyData();
      setMyBooks(myData.myBooks);
      setAllSeries(myData.series);
      setArchived(myData.archivedSeries);
      setLoading(false);
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
    console.log('changeArchiveStatus', seriesId, archived);
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
      console.log('Found the series: ', selectedSeries);
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

  // if (loading) {
  //   return (
  //     <>
  //       Hello
  //       <Skeleton active />
  //     </>
  //   );
  // }

  return <Show active={series} completed={completedSeries} archived={archivedSeries} loading={loading} myBooks={myBooks} onArchive={changeArchiveStatus} />;

  // return (
  //   <Grid container spacing={2} margin={2}>
  //     <Grid xs={2}>
  //       <List>
  //         <ListItem>
  //           <ListItemButton onClick={(e) => setShowType(1)}>
  //             <ListItemIcon>
  //               <SendIcon />
  //             </ListItemIcon>
  //             <ListItemText primary="Active Series" />
  //           </ListItemButton>
  //         </ListItem>
  //         <ListItem>
  //           <ListItemButton onClick={(e) => setShowType(2)}>
  //             <ListItemIcon>
  //               <DoneAllIcon />
  //             </ListItemIcon>
  //             <ListItemText primary="Completed Series" />
  //           </ListItemButton>
  //         </ListItem>
  //         <ListItem>
  //           <ListItemButton onClick={(e) => setShowType(3)}>
  //             <ListItemIcon>
  //               <InboxIcon />
  //             </ListItemIcon>
  //             <ListItemText primary="Archived Series" />
  //           </ListItemButton>
  //         </ListItem>
  //         <ListItem>{series.length + completedSeries.length + archivedSeries.length} Series</ListItem>
  //         <ListItem>{myBooks.length} Books owned</ListItem>
  //       </List>
  //     </Grid>
  //     <Grid xs={10}>
  //       <Grid container spacing={2}>
  //         {showSeries
  //           .sort((a: SeriesDataResponse, b: SeriesDataResponse) => {
  //             if (!a.latestBook || !b.latestBook) {
  //               return -1;
  //             }
  //             return a.latestBook.released < b.latestBook.released ? 1 : -1;
  //           })
  //           .map((s) => (
  //             <Grid key={s.asin} xs={12} style={{ marginBottom: 12 }}>
  //               <SeriesComponent series={s} myBooks={myBooks} onArchive={changeArchiveStatus} isArchived={isArchived(s.id)} key={s.id} />
  //             </Grid>
  //           ))}
  //       </Grid>
  //     </Grid>
  //   </Grid>
  // );
}

export default SeriesPage;