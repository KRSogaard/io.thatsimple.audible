import React from 'react';
import ReactTimeAgo from 'react-time-ago';
import { EpocToDate } from '../../utils/DateUtils';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';

const Released = (props: any) => {
  let { time, futureText, pastText } = props;
  let [showDate, setShowDate] = React.useState(false);
  TimeAgo.addLocale(en);

  let releasedDate = EpocToDate(time);

  let text = releasedDate > new Date() ? futureText : pastText;
  return (
    <span onClick={(e) => setShowDate(!showDate)}>
      {text} <span style={{ cursor: 'pointer' }}>{showDate ? releasedDate.toLocaleDateString() : <ReactTimeAgo date={EpocToDate(time)} />}</span>
    </span>
  );
};

export default Released;
