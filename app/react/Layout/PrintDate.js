import PropTypes from 'prop-types';
import React from 'react';
import { format } from 'date-fns';

const PrintDate = ({ utc, toLocal }) => {
  let date;
  if (!toLocal) {
    date = format(new Date(utc), 'PP');
  }

  if (toLocal) {
    date = format(new Date(utc), 'PP');
  }
  return <span>{date}</span>;
};

PrintDate.propTypes = {
  utc: PropTypes.number,
  toLocal: PropTypes.bool,
};

export default PrintDate;
