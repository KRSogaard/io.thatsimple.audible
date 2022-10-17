import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { AudibleService, BookDataResponse } from '../../services/AudibleService';
import { Typography, Paper, Link, Button, Chip } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Summary from './Summary';
import Released from './Released';
import Book from './Book';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';

const SeriesComponent = (props: any) => {
  let { series, myBooks, onArchive, isArchived } = props;
  let [isOpen, setIsOpen] = React.useState(false);
  let audibleService = new AudibleService();
  let bookCount = series.books.filter((b: any) => myBooks.includes(b.id)).length;
  let sortedBooks = series.books.sort((a: BookDataResponse, b: BookDataResponse) => b.released - a.released);
  let newBooksSinceLastPurchase = 0;
  for (let i = 0; i < sortedBooks.length; i++) {
    if (myBooks.includes(sortedBooks[i].id)) {
      break;
    }
    newBooksSinceLastPurchase++;
  }
  if (series.books.length === 0) {
    console.error('Series has no books', series);
    return null;
  }
  if (!series.latestBook) {
    console.error('Series has no latest book', series);
    return null;
  }

  return (
    <>
      <Paper>
        <Grid container spacing={2}>
          <Grid xs="auto">
            <img src={audibleService.getImageUrl(series.latestBook.asin)} alt={'Image for ' + series.latestBook.asin} width={151} height={151} />
          </Grid>
          <Grid xs>
            <div style={{ float: 'right', cursor: 'pointer' }}>
              {!isArchived && <Chip style={{ marginRight: '8px' }} onClick={() => onArchive(series.id, true)} icon={<ArchiveIcon />} label="Archive series" />}
              {isArchived && (
                <Chip style={{ marginRight: '8px' }} onClick={() => onArchive(series.id, false)} icon={<UnarchiveIcon />} label="Unarchive series" />
              )}
              {isOpen && <Chip onClick={(e) => setIsOpen(false)} icon={<KeyboardArrowUpIcon />} label="Collapse books" />}
              {!isOpen && <Chip onClick={(e) => setIsOpen(true)} icon={<KeyboardArrowDownIcon />} label="Expand books" />}
            </div>
            <Typography style={{ cursor: 'pointer' }} variant="h5" onClick={(e) => setIsOpen(!isOpen)}>
              {series.name}
              <Link style={{ marginLeft: '10px' }} href={series.link} target="_blank" rel="noreferrer">
                <Typography variant="caption">to audible</Typography>
              </Link>
            </Typography>
            <Typography variant="subtitle1">{'You have ' + bookCount + ' of ' + series.books.length + ' books'}</Typography>
            <Typography variant="subtitle1">
              <Released pastText="Latest book was released" futureText="Next book will be released in" time={series.latestBook.released} />
            </Typography>
            <Typography variant="subtitle1">
              {newBooksSinceLastPurchase > 0 ? newBooksSinceLastPurchase + ' new books since last purchase' : 'You have the latest book'}
            </Typography>
            <Summary text={series.summary} />
          </Grid>
        </Grid>
      </Paper>
      <Grid container spacing={2}>
        {isOpen && (
          <Grid xs={12}>
            {sortedBooks.map((b: BookDataResponse) => (
              <Book key={b.id} myBooks={myBooks} book={b} />
            ))}
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default SeriesComponent;
