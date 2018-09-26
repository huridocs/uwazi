import PropTypes from 'prop-types';
import React from 'react';

import { Translate } from 'app/I18N';
import { withRouter } from 'react-router';
import { CurrentLocationLink } from 'app/Layout';

const disableButton = (page, pageToDisable) => ({
    className: page === pageToDisable ? 'btn disabled' : 'btn',
    rel: page === pageToDisable ? 'nofollow' : undefined
});

const Paginator = ({ page, totalPages, onPageChange }) => (
  <div className="paginator">
    <CurrentLocationLink
      queryParams={{ page: page - 1 }}
      onClick={(e) => {
        e.preventDefault();
        onPageChange(page - 1);
      }}
      {...disableButton(page, 1)}
    >
      <Translate>Previous</Translate>
    </CurrentLocationLink>
    <span>{` ${page} / ${totalPages} `}</span>
    <CurrentLocationLink
      queryParams={{ page: page + 1 }}
      onClick={(e) => {
        e.preventDefault();
        onPageChange(page + 1);
      }}
      {...disableButton(page, totalPages)}
    >
      <Translate>Next</Translate>
    </CurrentLocationLink>
  </div>
);

Paginator.defaultProps = {
  page: 1,
  totalPages: 1,
  onPageChange: () => {}
};

Paginator.propTypes = {
  page: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func
};

export default Paginator;

const PaginatorWithPage = withRouter((props) => {
  const { location, ...restProps } = props;
  return <Paginator {...restProps} page={Number(location.query.page || 1)} />;
});

export { PaginatorWithPage };
