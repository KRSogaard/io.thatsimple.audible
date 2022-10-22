import React from 'react';
import { Card, Row, Col, List, Button } from 'antd';
import AudibleService, { BookDataResponse } from '../../../services/AudibleService';
import Summary from './Summary';
import Released from '../../../components/Released';
import Book from './Book';
import { MdUnarchive, MdArchive } from 'react-icons/md';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

// import Grid from '@mui/material/Unstable_Grid2';
// import { Typography, Paper, Link, Button, Chip } from '@mui/material';
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
// import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
// import ArchiveIcon from '@mui/icons-material/Archive';
// import UnarchiveIcon from '@mui/icons-material/Unarchive';
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

  return (
    <Card style={{ marginBottom: '8px' }}>
      <div style={{ float: 'right', cursor: 'pointer' }}>
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
      </div>
      <Row>
        <Col>
          <img src={AudibleService.getImageUrl(series.latestBook.asin)} alt={'Image for ' + series.latestBook.asin} width={151} height={151} />
        </Col>
        <Col style={{ paddingLeft: '8px' }}>
          <Row>
            <Col>{series.name}</Col>
          </Row>
          <Row>
            <Col>
              <List
                dataSource={series.books}
                renderItem={(item: BookDataResponse) => (
                  <List.Item key={'book-' + item.id} actions={[<a key="list-loadmore-edit">edit</a>, <a key="list-loadmore-more">more</a>]}></List.Item>
                )}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

//  <Grid container spacing={2}>
//     <Grid xs="auto">

//     </Grid>
//     <Grid xs>
//       <Typography style={{ cursor: 'pointer' }} variant="h5" onClick={(e) => setIsOpen(!isOpen)}>
//         {series.name}
//         <Link style={{ marginLeft: '10px' }} href={series.link} target="_blank" rel="noreferrer">
//           <Typography variant="caption">to audible</Typography>
//         </Link>
//       </Typography>
//       <Typography variant="subtitle1">{'You have ' + bookCount + ' of ' + series.books.length + ' books'}</Typography>
//       <Typography variant="subtitle1">
//         <Released pastText="Latest book was released" futureText="Next book will be released in" time={series.latestBook.released} />
//       </Typography>
//       <Typography variant="subtitle1">
//         {newBooksSinceLastPurchase > 0 ? newBooksSinceLastPurchase + ' new books since last purchase' : 'You have the latest book'}
//       </Typography>
//       <Summary text={series.summary} />
//     </Grid>
//   </Grid>
// <Grid container spacing={2}>
//   {isOpen && (
//     <Grid xs={12}>
//       {sortedBooks.map((b: BookDataResponse) => (
//         <Book key={b.id} myBooks={myBooks} book={b} />
//       ))}
//     </Grid>
//   )}
export default SeriesComponent;
