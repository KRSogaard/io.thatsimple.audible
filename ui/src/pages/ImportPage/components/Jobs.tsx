import { Card, Breadcrumb, List, Row, Col, Typography } from 'antd';
import { Helmet } from 'react-helmet-async';
import JobItem from './JobItem';

const Jobs = (props: any) => {
  const { jobs } = props;
  const { Text, Title } = Typography;

  return (
    <div style={{ margin: '0 50px' }}>
      <Helmet>
        <title>Import Jobs</title>
        <meta name="description" content="Import Jobs" />
      </Helmet>

      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item>Import</Breadcrumb.Item>
        <Breadcrumb.Item>Jobs ({jobs.length})</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col span={24}>
          <Card>
            <Title level={3}>Importing</Title>
            <Row>
              <Col>
                <Text>Importing books can take some time as we have a limited connection to Audible to avoid issue our services getting banned.</Text>
              </Col>
            </Row>
            <Row>
              <Col>
                <Text>While downloading books and series, new jobs may be created to download books you don't own in seires you follow.</Text>
              </Col>
            </Row>
            <Row>
              <Col>
                <Text strong>When there are no jobs left, the import is complete.</Text>
              </Col>
            </Row>
            <Row>
              <Col>
                <Text>
                  {' '}
                  Please know you share a queue with other users and they jobs will not show uo here, that is the reason that jobs are not being processed right
                  away.
                </Text>
              </Col>
            </Row>
            <Row>
              <Col>
                <Text>You can browse your Audible books while it is importing, and you can always com back here to check the status</Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Card>
            <Title level={3}>{jobs.length} jobs remaining</Title>
            <List>
              {jobs.map((job: any, index: number) => {
                return (
                  <List.Item key={'job-' + job.id}>
                    <JobItem job={job} index={index} />
                  </List.Item>
                );
              })}
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Jobs;
