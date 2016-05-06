import React, {PropTypes} from 'react';
import moment from 'moment';

export default function UTCToLocal({utc}) {
  let date = moment(moment(utc).toDate()).format('ll');
  return <span>{date}</span>;
}

UTCToLocal.propTypes = {
  utc: PropTypes.number
};
