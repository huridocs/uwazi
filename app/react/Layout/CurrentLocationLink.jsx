import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router';

const validProps = props => {
  const { to, replace, ...valid } = props;
  return valid;
};

const CurrentLocationLink = ({ children, queryParams = {}, replace, ...otherProps }) => {
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
    <Link
      to={`${location.pathname}?${query.toString()}`}
      replace={replace}
      {...validProps(otherProps)}
    >
      {children}
    </Link>
  );
};

CurrentLocationLink.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  queryParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  replace: PropTypes.bool,
};

export { CurrentLocationLink };

export default CurrentLocationLink;
