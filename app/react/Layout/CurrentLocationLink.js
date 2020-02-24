import { Link, withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React from 'react';

import { toUrlParams } from 'shared/JSONRequest';

const newParams = (oldQuery, newQuery) => {
  const params = Object.assign({}, oldQuery, newQuery);
  return Object.keys(params).reduce((memo, key) => {
    if (params[key] !== '') {
      return Object.assign(memo, { [key]: params[key] });
    }
    return memo;
  }, {});
};

const validProps = props => {
  const { to, ...valid } = props;
  return valid;
};

const CurrentLocationLink = ({ children, location, queryParams, ...otherProps }) => (
  // eslint-disable-next-line jsx-a11y/anchor-is-valid
  <Link
    to={`${location.pathname}${toUrlParams(newParams(location.query, queryParams))}`}
    {...validProps(otherProps)}
  >
    {children}
  </Link>
);

CurrentLocationLink.defaultProps = {
  children: '',
  queryParams: {},
};

CurrentLocationLink.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  queryParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  location: PropTypes.shape({
    pathanem: PropTypes.string,
    query: PropTypes.object,
  }).isRequired,
};

export { CurrentLocationLink };

export default withRouter(CurrentLocationLink);
