import PropTypes from 'prop-types';
import React from 'react';

import { Translate } from 'app/I18N';
import { Link } from 'react-router';

const disableButton = (page, pageToDisable) => ({
    className: page === pageToDisable ? 'disabled' : undefined,
    rel: page === pageToDisable ? 'nofollow' : undefined
});

const Paginator = ({ page, totalPages, onPageChange }) => (
  <div>
    <Link onClick={() => onPageChange(page - 1)} {...disableButton(page, 1)}>
      <Translate>Previous</Translate>
    </Link>
    <span>{` ${page} / ${totalPages} `}</span>
    <Link onClick={() => onPageChange(page + 1)} {...disableButton(page, totalPages)}>
      <Translate>Next</Translate>
    </Link>
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
  baseUrl: PropTypes.string.isRequired,
  onPageChange: PropTypes.func
};

export default Paginator;
