import { List, Avatar } from 'antd';

const TimeSpan = (props: any) => {
  const { job, index } = props;

  let payload = JSON.parse(job.payload);

  let text = '';
  let title = '';
  if (job.type === 'book') {
    title = 'Downloading book ASIN: ' + payload.asin;
    text = 'Job id: ' + job.id;
  } else if (job.type === 'series') {
    title = 'Downloading series ASIN: ' + payload.asin;
    text = 'Job id: ' + job.id;
  }

  return <List.Item.Meta avatar={<Avatar>{index + 1}</Avatar>} title={title} description={text} />;
};

export default TimeSpan;
