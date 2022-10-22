import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Button, TextField, Typography, Paper, Card, CardContent, CardHeader } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Released from '../../../components/Released';
import Parser from '@gregoranders/csv';

const TimeSpan = (props: any) => {
  const { job, index } = props;

  let payload = JSON.parse(job.payload);

  return (
    <>
      <ListItem key={job.id} secondaryAction={<Released futureText="" pastText="" time={job.created} />}>
        <ListItemAvatar>
          <Avatar>{index + 1}</Avatar>
        </ListItemAvatar>
        {job.type === 'book' && <ListItemText primary={'Downloading book ' + payload.title} secondary={'Job id: ' + job.id} />}
        {job.type === 'series' && <ListItemText primary={'Downloading series ' + payload.name} secondary={'Job id: ' + job.id} />}
      </ListItem>
    </>
  );
};

export default TimeSpan;
