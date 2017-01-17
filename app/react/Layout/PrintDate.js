import React, {PropTypes} from 'react';
import moment from 'moment';

export default function PrintDate({utc, toLocal}) {
  let date;
  if (!toLocal) {
    date = moment.utc(utc).format('ll');
  }

  if (toLocal) {
    date = moment(moment(utc).toDate()).format('ll');
  }
  return <span>{date}</span>;
}

PrintDate.propTypes = {
  utc: PropTypes.number,
  toLocal: PropTypes.bool
};
