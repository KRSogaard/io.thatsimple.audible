import React from 'react';
import { Card, Row, Col, Button, Typography, Space } from 'antd';
import AudibleService, { BookDataResponse } from '../../../services/AudibleService';
import Summary from './Summary';
import Released from '../../../components/Released';
import Book from './Book';
import { MdUnarchive, MdArchive } from 'react-icons/md';
import { FaAudible } from 'react-icons/fa';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const SeriesComponent = (props: any) => {
  let { series, myBooks, onArchive, isArchived } = props;
  let [isOpen, setIsOpen] = React.useState(false);
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

  const { Text, Link, Title } = Typography;

  return (
    <Card>
      <Row>
        <Col span={4} onClick={(e) => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
          <img src={AudibleService.getImageUrl(series.latestBook.asin)} alt={'Image for ' + series.latestBook.asin} width={151} height={151} />
        </Col>
        <Col span={20}>
          <Row>
            <Col flex="auto">
              <Title style={{ cursor: 'pointer' }} onClick={(e) => setIsOpen(!isOpen)} level={4}>
                {series.name}
                <Link style={{ marginLeft: '10px' }} href={series.link} target="_blank" rel="noreferrer">
                  <span role="img" className="anticon">
                    <FaAudible color="#FF9900" />
                  </span>
                </Link>
              </Title>
            </Col>
            <Col flex="none">
              {!isArchived && (
                <Button
                  style={{ marginRight: '8px' }}
                  onClick={() => onArchive(series.id, true)}
                  size="large"
                  icon={
                    <span role="img" className="anticon">
                      <MdArchive size={'1em'} />
                    </span>
                  }>
                  Archive series
                </Button>
              )}
              {isArchived && (
                <Button
                  style={{ marginRight: '8px' }}
                  onClick={() => onArchive(series.id, false)}
                  size="large"
                  icon={
                    <span role="img" className="anticon">
                      <MdUnarchive size={'1em'} />
                    </span>
                  }>
                  Unarchive series
                </Button>
              )}
              {isOpen && (
                <Button onClick={(e) => setIsOpen(false)} size="large" icon={<UpOutlined />}>
                  Collapse books
                </Button>
              )}
              {!isOpen && (
                <Button onClick={(e) => setIsOpen(true)} size="large" icon={<DownOutlined />}>
                  Expand books
                </Button>
              )}
            </Col>
          </Row>
          <Row>
            <Col>
              <Space>
                <Text>{'You have ' + bookCount + ' of ' + series.books.length + ' books'}</Text>
                {newBooksSinceLastPurchase > 0 ? (
                  <Text type="warning">{newBooksSinceLastPurchase} new books since last purchase</Text>
                ) : (
                  <Text type="success">You have the latest book</Text>
                )}
              </Space>
            </Col>
          </Row>
          <Row>
            <Col>
              <Text>
                <Released pastText="Latest book was released" futureText="Next book will be released in" time={series.latestBook.released} />
              </Text>
            </Col>
          </Row>
          <Row style={{ marginTop: '8px' }}>
            <Col>
              <Summary text={series.summary} />
            </Col>
          </Row>
        </Col>
      </Row>
      {isOpen && (
        <Row>
          <Col offset={2} span={22}>
            {series.books.map((book: BookDataResponse) => (
              <Row style={{ marginTop: '8px' }} key={'book-' + book.id}>
                <Col span={24}>
                  <Book book={book} myBooks={myBooks} />
                </Col>
              </Row>
            ))}
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default SeriesComponent;
