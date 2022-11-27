import React from 'react';
import { Typography } from 'antd';

const Summary = (props: any) => {
  let { text } = props;
  let [shortend, setShortend] = React.useState(true);

  const { Paragraph, Text } = Typography;

  if (!text || text.length < 200) {
    return (
      <Typography>
        <Text strong>Summary: </Text>
        {text}
      </Typography>
    );
  }

  if (shortend) {
    let shortText = text.substring(0, 200);
    if (text.length > 200) {
      let lastSpace = shortText.lastIndexOf(' ');
      shortText = shortText.substring(0, lastSpace) + '...';
    }
    return (
      <Paragraph style={{ cursor: 'pointer' }} onClick={(e) => setShortend(false)}>
        <Text strong>Summary: </Text>
        {shortText}
      </Paragraph>
    );
  }
  return (
    <Paragraph style={{ cursor: 'pointer' }} onClick={(e) => setShortend(true)}>
      <Text strong>Summary: </Text>
      {text}
    </Paragraph>
  );
};

export default Summary;
