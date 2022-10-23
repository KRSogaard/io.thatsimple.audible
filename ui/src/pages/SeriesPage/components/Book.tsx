import AudibleService from '../../../services/AudibleService';
import Released from '../../../components/Released';
import Summary from './Summary';
import TimeSpan from './TimeSpan';
import { Row, Col, Typography } from 'antd';
import { FaAudible } from 'react-icons/fa';

const Book = (props: any) => {
  let { book, myBooks } = props;

  let hasBook = myBooks.includes(book.id);
  const { Text, Link, Title } = Typography;

  return (
    <Row>
      <Col span={4}>
        <img src={AudibleService.getImageUrl(book.asin)} alt={'Image for ' + book.asin} width={151} height={151} />
      </Col>
      <Col span={20}>
        <Row>
          <Col>
            <Title level={4}>
              {book.title}
              <Link style={{ marginLeft: '10px' }} href={book.link} target="_blank" rel="noreferrer">
                <span role="img" className="anticon">
                  <FaAudible color="#FF9900" />
                </span>
              </Link>
            </Title>
          </Col>
        </Row>
        <Row>
          <Col>{hasBook ? <Text type="success">You own this book</Text> : <Text type="warning">You are missing this book</Text>}</Col>
        </Row>
        <Row>
          <Col>
            <Released futureText="Will be released in" pastText="Was released" time={book.released} />
          </Col>
        </Row>
        <Row>
          <Col>
            <Text strong>Length:</Text> <TimeSpan seconds={book.length} />
          </Col>
        </Row>
        <Row>
          <Col>
            <Summary text={book.summary} />
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Book;
