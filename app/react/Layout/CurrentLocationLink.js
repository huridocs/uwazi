import { Link, withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React from 'react';

import { toUrlParams } from 'shared/JSONRequest';

const CurrentLocationLink = ({ children, location, queryParams }) => (
  // eslint-disable-next-line jsx-a11y/anchor-is-valid
  <Link to={`${location.pathname}${toUrlParams(Object.assign({}, location.query, queryParams))}`}>{children}</Link>
);

CurrentLocationLink.defaultProps = {
  children: '',
  queryParams: {},
};

CurrentLocationLink.propTypes = {
  children: PropTypes.string,
  queryParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  location: PropTypes.shape({
    pathanem: PropTypes.string,
    query: PropTypes.object
  }).isRequired,
};

export { CurrentLocationLink };

export default withRouter(CurrentLocationLink);
