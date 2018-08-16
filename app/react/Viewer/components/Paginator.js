import PropTypes from 'prop-types';
import React from 'react';

import { I18NLink, Translate } from 'app/I18N';

const disableButton = (page, pageToDisable) => ({
    className: page === pageToDisable ? 'disabled' : undefined,
    rel: page === pageToDisable ? 'nofollow' : undefined
});

const conformUrl = (baseUrl, page) => baseUrl.match(/\?/g) ? `${baseUrl}&page=${page}` : `${baseUrl}?page=${page}`;

const Paginator = ({ page, totalPages, baseUrl, onPageChange }) => (
  <div>
    <I18NLink onClick={() => onPageChange(page - 1)} to={conformUrl(baseUrl, page - 1)} {...disableButton(page, 1)}>
      <Translate>Previous</Translate>
    </I18NLink>
    <span>{` ${page} / ${totalPages} `}</span>
    <I18NLink onClick={() => onPageChange(page + 1)} to={conformUrl(baseUrl, page + 1)} {...disableButton(page, totalPages)}>
      <Translate>Next</Translate>
    </I18NLink>
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
