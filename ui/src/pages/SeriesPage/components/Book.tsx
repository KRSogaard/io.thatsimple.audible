import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import AudibleService from '../../../services/AudibleService';
import { Typography, Link, Paper } from '@mui/material';
import Released from '../../../components/Released';
import Summary from './Summary';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import TimeSpan from './TimeSpan';

const Book = (props: any) => {
  let { book, myBooks } = props;

  let hasBook = myBooks.includes(book.id);

  return (
    <Grid container>
      <Grid xs={11} xsOffset={1}>
        <Paper>
          <Grid container>
            <Grid xs={'auto'}>
              <img src={AudibleService.getImageUrl(book.asin)} alt={'Image for ' + book.asin} width={151} height={151} />
            </Grid>
            <Grid xs>
              <Typography variant="h5">
                {hasBook ? <DoneIcon color="primary" /> : <CloseIcon color="error" />}
                {book.title}
                <Link style={{ marginLeft: '10px' }} href={book.link} target="_blank" rel="noreferrer">
                  <Typography variant="caption">to audible</Typography>
                </Link>
              </Typography>
              <Typography variant="subtitle1">
                <Released futureText="Will be released in" pastText="Was released" time={book.released} />
              </Typography>
              <Typography variant="subtitle1">
                Length: <TimeSpan seconds={book.length} />
              </Typography>
              <Summary text={book.summary} />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Book;
