import { useState, useEffect } from 'react';
import { useInterval } from 'usehooks-ts';
import AudibleService, { Job } from '../../services/AudibleService';
import Parser from '@gregoranders/csv';
import { Helmet } from 'react-helmet-async';
import { Card, Breadcrumb, Input, Row, Col, Button, Typography, List } from 'antd';
import Jobs from './components/Jobs';
import { useLoaderData } from 'react-router';

function ImportPage() {
  const initalJobs: Job[] | null = useLoaderData() as Job[] | null;

  const siteMap =
    '{"_id":"audible","startUrl":["https://www.audible.com/library/audiobooks?pageSize=50"],"selectors":[{"id":"pagination","parentSelectors":["_root","pagination"],"paginationType":"auto","selector":".nextButton:not(.bc-button-disabled) a","type":"SelectorPagination"},{"id":"books","parentSelectors":["pagination"],"type":"SelectorElement","selector":"div.adbl-library-content-row","multiple":true},{"id":"title","parentSelectors":["books"],"type":"SelectorText","selector":"span.bc-size-headline3","multiple":false,"regex":""},{"id":"author","parentSelectors":["books"],"type":"SelectorText","selector":".authorLabel a","multiple":false,"regex":""},{"id":"book-link","parentSelectors":["books"],"type":"SelectorLink","selector":".bc-list-item > a","multiple":false}]}';
  const [importText, setImportText] = useState('');
  const [delay, setDelay] = useState<number>(10000);
  const [canImport, setCanImport] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [exception, setException] = useState<Error | null>(null);
  if (exception) {
    throw exception;
  }

  useEffect(() => {
    console.log('Setting jobs: ', initalJobs);
    setJobs(initalJobs || []);
  }, [initalJobs]);

  useEffect(() => {
    setCanImport(importText.length > 0 && importText.trim().startsWith('web-scraper-order'));
  }, [importText]);

  useInterval(async () => {
    try {
      setJobs(await AudibleService.getJobs());
    } catch (e: any) {
      console.log('Got error:', e);
      setException(e);
    }
  }, delay);

  const startImport = async () => {
    setLoading(true);
    try {
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

        let asin: string | undefined = row[6]?.split('?')[0]?.split('/')?.pop();
        if (!asin) {
          console.log('No asin found', row[6]);
        } else {
          await AudibleService.requestDownload(asin);
        }
      });
    } catch (e) {
      console.error('Failed while importing', e);
      setLoading(false);
    }
    setImportText('');
  };

  if (jobs.length > 0) {
    if (loading) {
      console.log('Setting loading to false');
      setLoading(false);
    }
    return <Jobs jobs={jobs} />;
  }

  const { Title, Text, Link } = Typography;

  return (
    <div style={{ margin: '0 50px' }}>
      <Helmet>
        <title>Welcome</title>
        <meta name="description" content="Welcome" />
      </Helmet>

      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item>Import</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Row>
          <Col span={24}>
            <Input.TextArea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Input your web scraper export here"
              autoSize={{ minRows: 15, maxRows: 15 }}
            />
          </Col>
        </Row>

        <Row style={{ marginTop: '5px' }}>
          <Col span={24}>
            <Button style={{ width: '100%' }} type="primary" loading={loading} disabled={!canImport} onClick={startImport}>
              Start Import
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: '8px' }}>
        <Row>
          <Col span={24}>
            <Title level={4}>How to import</Title>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <List>
              <List.Item>
                <Text>
                  Install the WebScraper plugin or Chrome or Firefox from
                  <Link href="https://webscraper.io/" target="_blank" style={{ marginLeft: '5px' }}>
                    https://webscraper.io/
                  </Link>
                </Text>
              </List.Item>
              <List.Item>
                Import the sitemap
                <Input.TextArea value={siteMap} disabled autoSize={{ minRows: 5, maxRows: 5 }} />
                <Button
                  style={{ width: '100%' }}
                  onClick={() => {
                    navigator.clipboard.writeText(siteMap);
                  }}>
                  Copy to clipboard
                </Button>
              </List.Item>
              <List.Item>
                <Text>
                  Login to Audible
                  <Link style={{ marginLeft: '5px' }} href="https://www.audible.com/" target="_blank">
                    https://www.audible.com/
                  </Link>
                </Text>
              </List.Item>
              <List.Item>Select the Audible Sitemap</List.Item>
              <List.Item>Click the Sitemap audible dropdown and select Scraper</List.Item>
              <List.Item>let it finish, it is set to be slow to prevent issues with Audible</List.Item>
              <List.Item>Select Export data in the Sitemap audible dropdown</List.Item>
              <List.Item>Select .CSV</List.Item>
              <List.Item>Copy the content of the CSV file in the import field above click Start Import</List.Item>
            </List>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default ImportPage;
