import React, { useState, useEffect } from 'react';
import { useInterval } from 'usehooks-ts';
import AudibleService, { Job } from '../../services/AudibleService';
import Grid from '@mui/material/Unstable_Grid2';
import { Button, TextField, Typography, Paper, Card, CardContent, CardHeader, Link, ListItemButton } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Parser from '@gregoranders/csv';
import JobItem from './components/JobItem';
import Released from '../../components/Released';

function ImportPage() {
  const siteMap =
    '{"_id":"audible","startUrl":["https://www.audible.com/library/audiobooks?pageSize=50"],"selectors":[{"id":"pagination","parentSelectors":["_root","pagination"],"paginationType":"auto","selector":".nextButton:not(.bc-button-disabled) a","type":"SelectorPagination"},{"id":"books","parentSelectors":["pagination"],"type":"SelectorElement","selector":"div.adbl-library-content-row","multiple":true},{"id":"title","parentSelectors":["books"],"type":"SelectorText","selector":"span.bc-size-headline3","multiple":false,"regex":""},{"id":"author","parentSelectors":["books"],"type":"SelectorText","selector":".authorLabel a","multiple":false,"regex":""},{"id":"book-link","parentSelectors":["books"],"type":"SelectorLink","selector":".bc-list-item > a","multiple":false}]}';
  const [importText, setImportText] = useState('');
  const [delay, setDelay] = useState<number>(10000);
  const [canImport, setCanImport] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function _() {
      setJobs(await AudibleService.getJobs());
    }
    _();
  }, []);

  useEffect(() => {
    setCanImport(importText.length > 0 && importText.trim().startsWith('web-scraper-order'));
  }, [importText]);

  useInterval(async () => {
    setJobs(await AudibleService.getJobs());
  }, delay);

  const startImport = async () => {
    let rows = new Parser().parse(importText);
    rows.forEach(async (row) => {
      if (row[0].startsWith('web')) {
        console.log('Not a row');
        return;
      }
      if (row[6].length === 0 || !row[6].startsWith('https://')) {
        console.log('Not a valid url', row);
        return;
      }

      await AudibleService.requestDownload(row[6].split('?')[0]);
      console.log('Requested download of book', row[6]);
    });
    setImportText('');
  };

  if (jobs.length > 0) {
    return (
      <Grid container spacing={2} margin={2}>
        <Grid xs={6} xsOffset={3}>
          <Card>
            <CardHeader title="Current import in progress" subheader={'Processing ' + jobs.length + ' jobs'} />
            {/* <List sx={{ bgcolor: 'background.paper' }}> */}
            <CardContent>
              <List>
                {jobs
                  .sort((a, b) => a.created - b.created)
                  .map((job, index) => {
                    return <JobItem job={job} index={index} key={job.id} />;
                  })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} margin={2}>
      <Grid xs={6} xsOffset={3}>
        <Paper style={{ marginTop: '8' }}>
          <Grid container spacing={2} margin={2}>
            <Grid xs={12}>
              <Typography variant="h4">Import books</Typography>
            </Grid>
            <Grid xs={12}>
              <TextField fullWidth multiline maxRows={20} label="Import" value={importText} onChange={(e) => setImportText(e.target.value)} />
            </Grid>
            <Grid xs={12}>
              <Button disabled={!canImport} onClick={(e) => startImport()} size="large" variant="contained">
                Start import
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid xs={6} xsOffset={3}>
        <Paper style={{ marginTop: '8', padding: '8' }}>
          <Grid container spacing={2} margin={2}>
            <Grid xs={12}>
              <Typography variant="h4">How to import</Typography>
              <List>
                <ListItem>
                  <Typography>Install the WebScraper plugin or Chrome or Firefox from</Typography>
                  <Link href="https://webscraper.io/" target="_blank">
                    https://webscraper.io/
                  </Link>
                </ListItem>
                <ListItem>
                  <Grid container>
                    <Grid xs={12}>Import the sitemap</Grid>
                    <Grid xs={12}>
                      <TextField multiline={true} fullWidth={true} value={siteMap} disabled />
                    </Grid>
                    <Grid xs={12}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                          navigator.clipboard.writeText(siteMap);
                        }}>
                        Copy to clipboard
                      </Button>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Typography>Login to Audible</Typography>
                  <Link href="https://www.audible.com/" target="_blank">
                    https://www.audible.com/
                  </Link>
                </ListItem>
                <ListItem>Select the Audible Sitemap</ListItem>
                <ListItem>Click the Sitemap audible dropdown and select Scraper</ListItem>
                <ListItem>let it finish, it is set to be slow to prevent issues with Audible</ListItem>
                <ListItem>Select Export data in the Sitemap audible dropdown</ListItem>
                <ListItem>Select .CSV</ListItem>
                <ListItem>Copy the content of the CSV file in the import field above click Start Import</ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default ImportPage;
