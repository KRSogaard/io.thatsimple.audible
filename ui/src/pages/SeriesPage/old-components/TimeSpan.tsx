const TimeSpan = (props: any) => {
  let { seconds } = props;

  let remaining = seconds;
  let hours = Math.floor(remaining / 3600);
  remaining = remaining - hours * 3600;
  let minutes = Math.floor(remaining / 60);
  remaining = remaining - minutes * 60;
  let secs = remaining;

  let text = '';
  if (hours > 1) {
    text += hours + ' hours ';
  } else if (hours === 1) {
    text += hours + ' hour ';
  }
  if (minutes > 1) {
    text += minutes + ' mins ';
  } else if (hours === 1) {
    text += minutes + ' min ';
  }
  if (secs > 1) {
    text += secs + ' secs ';
  } else if (hours === 1) {
    text += secs + ' sec ';
  }

  text = text.trim();

  return <>{text}</>;
};

export default TimeSpan;
