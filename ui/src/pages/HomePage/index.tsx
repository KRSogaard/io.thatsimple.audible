import { Helmet } from 'react-helmet-async';
import { Card, Breadcrumb, Row, Col } from 'antd';

function HomePage() {
  return (
    <div style={{ margin: '0 50px' }}>
      <Helmet>
        <title>Welcome</title>
        <meta name="description" content="Welcome" />
      </Helmet>

      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item>What is Audible Series</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col span={24}>
          <Card title="Welcome">
            Welcome to Audible Series That Simply. This is a simple web app to keep track of your audible series and find new books in seires that you follow
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default HomePage;
