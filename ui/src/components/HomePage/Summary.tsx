import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { AudibleService } from '../../services/AudibleService';
import { Typography, Box, Paper } from '@mui/material';

const Summary = (props: any) => {
  let { text } = props;
  let [shortend, setShortend] = React.useState(true);

  if (!text || text.length < 200) {
    return <Typography>{text}</Typography>;
  }

  if (shortend) {
    let shortText = text.substring(0, 200);
    if (text.length > 200) {
      let lastSpace = shortText.lastIndexOf(' ');
      shortText = shortText.substring(0, lastSpace) + '...';
    }
    return (
      <Typography variant="body2" style={{ cursor: 'pointer' }} onClick={(e) => setShortend(false)}>
        {shortText}
      </Typography>
    );
  }
  return (
    <Typography variant="body2" style={{ cursor: 'pointer' }} onClick={(e) => setShortend(true)}>
      {text}
    </Typography>
  );
};

export default Summary;
