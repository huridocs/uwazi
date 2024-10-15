import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

const validProps = props => {
  const { to, ...valid } = props;
  return valid;
};

const CurrentLocationLink = ({ children, queryParams = {}, ...otherProps }) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  Object.keys(queryParams).forEach(key => {
    query.set(key, queryParams[key]);
  });

  query.forEach((value, key) => {
    if (value === '') {
      query.delete(key);
    }
  });

  return (
    <Link to={`${location.pathname}?${query.toString()}`} {...validProps(otherProps)}>
      {children}
    </Link>
  );
};

CurrentLocationLink.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  queryParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

export { CurrentLocationLink };

export default CurrentLocationLink;
