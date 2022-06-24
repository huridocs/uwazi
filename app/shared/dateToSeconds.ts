import moment from 'moment';

const dateToSeconds = (value: string) => {
  let getDate = Date.parse(`${value} GMT`);
  if (Number.isNaN(getDate)) {
    const momentDate = moment
      .utc(value, ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'YYYY'], false)
      .format('x');
    getDate = parseInt(momentDate, 10);
  }
  const formattedDate = getDate / 1000;
  return formattedDate;
};

export { dateToSeconds };
