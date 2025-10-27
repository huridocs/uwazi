import PropTypes from 'prop-types';
import React from 'react';
import { DateTime } from 'luxon';

const PrintDate = ({ utc, toLocal }) => {
  if (utc == null) {
    return <span />;
  }

  let date;
  if (!toLocal) {
    date = DateTime.fromMillis(utc, { zone: 'utc' }).toLocaleString(DateTime.DATE_MED);
  }

  if (toLocal) {
    date = DateTime.fromMillis(utc).toLocaleString(DateTime.DATE_MED);
  }
  return <span>{date}</span>;
};

PrintDate.propTypes = {
  utc: PropTypes.number,
  toLocal: PropTypes.bool,
};

export default PrintDate;
