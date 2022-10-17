import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AudibleService, SeriesDataResponse } from '../services/AudibleService';
import Grid from '@mui/material/Unstable_Grid2';
import { ListItemIcon, ListItemText, List, ListItem, ListItemButton } from '@mui/material';
import SeriesComponent from '../components/HomePage/Series';
import SendIcon from '@mui/icons-material/Send';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import DoneAllIcon from '@mui/icons-material/DoneAll';

function HomePage() {
  const audibleService = new AudibleService();
  const [showType, setShowType] = useState(1);
  const [myBooks, setMyBooks] = useState<number[]>([]);
  const [series, setSeries] = useState<SeriesDataResponse[]>([]);
  const [completedSeries, setCompletedSeries] = useState<SeriesDataResponse[]>([]);
  const [archivedSeries, setArchivedSeries] = useState<SeriesDataResponse[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!audibleService.isAuthenticated()) {
        console.log('not authenticated');
        return;
      }

      const myData = await audibleService.getMyData();
      setMyBooks(myData.myBooks);

      let activeSeries: SeriesDataResponse[] = [];
      let completeSeries: SeriesDataResponse[] = [];
      let archivedSeries: SeriesDataResponse[] = [];
      myData.series.forEach((s: SeriesDataResponse) => {
        if (myData.archivedSeries.includes(s.id)) {
          archivedSeries.push(s);
        } else {
          if (s.books.filter((b) => !myData.myBooks.includes(b.id)).length === 0) {
            completeSeries.push(s);
          } else {
            activeSeries.push(s);
          }
        }
      });

      setSeries(activeSeries);
      setArchivedSeries(archivedSeries);
      setCompletedSeries(completeSeries);
    }
    fetchData();
  }, []);

  const changeArchiveStatus = async (seriesId: number, archived: boolean): Promise<void> => {
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
      audibleService.archiveSeries(seriesId);
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
      audibleService.unarchiveSeries(seriesId);
      setArchivedSeries(archivedSeries.filter((s) => s.id !== seriesId));
      if (selectedSeries.books.filter((b) => !myBooks.includes(b.id)).length === 0) {
        setCompletedSeries([...completedSeries, selectedSeries]);
      } else {
        setSeries([...series, selectedSeries]);
      }
    }
  };

  let showSeries = series;
  if (showType === 2) {
    showSeries = completedSeries;
  } else if (showType === 3) {
    showSeries = archivedSeries;
  }

  return (
    <Grid container spacing={2} margin={2}>
      <Grid xs={2}>
        <List>
          <ListItem>
            <ListItemButton onClick={(e) => setShowType(1)}>
              <ListItemIcon>
                <SendIcon />
              </ListItemIcon>
              <ListItemText primary="Active Series" />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={(e) => setShowType(2)}>
              <ListItemIcon>
                <DoneAllIcon />
              </ListItemIcon>
              <ListItemText primary="Completed Series" />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={(e) => setShowType(3)}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary="Archived Series" />
            </ListItemButton>
          </ListItem>
          <ListItem>{series.length + completedSeries.length + archivedSeries.length} Series</ListItem>
          <ListItem>{myBooks.length} Books owned</ListItem>
        </List>
      </Grid>
      <Grid xs={10}>
        <Grid container spacing={2}>
          {showSeries
            .sort((a: SeriesDataResponse, b: SeriesDataResponse) => {
              if (!a.latestBook || !b.latestBook) {
                return -1;
              }
              return a.latestBook.released < b.latestBook.released ? 1 : -1;
            })
            .map((s) => (
              <Grid key={s.asin} xs={12} style={{ marginBottom: 12 }}>
                <SeriesComponent series={s} myBooks={myBooks} onArchive={changeArchiveStatus} isArchived={showType === 3} key={s.id} />
              </Grid>
            ))}
        </Grid>
      </Grid>
    </Grid>
  );
}

export default HomePage;
