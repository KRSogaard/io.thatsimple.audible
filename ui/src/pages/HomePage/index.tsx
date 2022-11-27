import { Helmet } from 'react-helmet-async';
import { Card, Breadcrumb, Row, Col, Typography } from 'antd';
import { FaAudible, FaDiscord } from 'react-icons/fa';

function HomePage() {
  const { Title, Paragraph } = Typography;

  return (
    <div style={{ margin: '0 50px' }}>
      <Helmet>
        <title>Welcome </title>
        <meta name="description" content="Welcome" />
      </Helmet>

      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item>What is Audible Series Manager</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col span={24}>
          <Card title="Welcome">
            Welcome to Audible Series Manager That Simply. This is a simple web app to keep track of your audible series and find new books in seires that you
            follow
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: '10px' }}>
        <Col span={24}>
          <Card title="How it works">
            <Paragraph>
              Audible Series Manager will provide you with a easy overview of all the series that you follow.
              <br />
              Series are order by the the latest released booked.
              <br />
              You can easily navigate to Audible to purchase missing books by clicking the Audible icon
              <span role="img" className="anticon" style={{ marginLeft: '5px' }}>
                <FaAudible color="#FF9900" />
              </span>
            </Paragraph>
            <Paragraph>
              Series are grouped in Active, Completed and Archived. <br />
              <b>Active series</b> are series that you are following where you don't have all audio books yet.
              <br />
              <b>Completed series</b> are series where you have all books that has been released.
              <br />
              <b>Archived series</b> are series you have marked as archived, no longer following.
            </Paragraph>
            <Paragraph>
              Audible Series Manager have not connection to Audible, it is just a simple web app that will help you keep track of your series.
              <br />
              You can import your series from Audible by clicking the import button in the top menu. <br />
              On the import page there is a guide on how to import your series.
            </Paragraph>
            <Paragraph>
              Join our Discord at{' '}
              <a href="https://discord.gg/NcezYAbA">
                <span role="img" className="anticon">
                  <FaDiscord color="#7289da" />
                </span>{' '}
                https://discord.gg/NcezYAbA
              </a>{' '}
              if you have any questions or feedback.
            </Paragraph>
            <br />
            <Title level={3}>List of series</Title>
            <img src="series-list.png" alt="Series List" width={'75%'} />
            <br />
            <Title level={3}>Book in a series</Title>
            <img src="series-books-list.png" alt="Books in series" width={'75%'} />
            <br />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default HomePage;
