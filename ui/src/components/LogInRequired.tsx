import React from 'react';
import ReactTimeAgo from 'react-time-ago';
import { EpocToDate } from '../utils/DateUtils';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';

const LogInRequired = (props: any) => {
  let { link } = props;
  return <span>Authentication is required, redirecting you to the login page.</span>;
};

export default LogInRequired;
