/* eslint-disable react/jsx-props-no-spreading */
import PropTypes from 'prop-types';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { CurrentLocationLink } from 'app/Layout';

const disableButton = (page, pageToDisable) => ({
  className: page === pageToDisable ? 'btn disabled' : 'btn',
  rel: page === pageToDisable ? 'nofollow' : undefined,
});

const Paginator = ({ page, totalPages, onPageChange }) => {
  const prevPage = page - 1 || 1;
  const nextPage = page + 1 > totalPages ? totalPages : page + 1;
  return (
    <div className="paginator">
      <CurrentLocationLink
        queryParams={{ page: prevPage }}
        onClick={e => {
          e.preventDefault();
          onPageChange(prevPage);
        }}
        {...disableButton(page, 1)}
      >
        <Translate>Previous</Translate>
      </CurrentLocationLink>
      <span>{` ${page} / ${totalPages} `}</span>
      <CurrentLocationLink
        queryParams={{ page: nextPage }}
        onClick={e => {
          e.preventDefault();
          onPageChange(nextPage);
        }}
        {...disableButton(page, totalPages)}
      >
        <Translate>Next</Translate>
      </CurrentLocationLink>
    </div>
  );
};

Paginator.defaultProps = {
  page: 1,
  totalPages: 1,
  onPageChange: () => {},
};

Paginator.propTypes = {
  page: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
};

// eslint-disable-next-line react/no-multi-comp
const PaginatorWithPage = props => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const { ...restProps } = props;
  return <Paginator {...restProps} page={Number(query.page || 1)} />;
};

export { PaginatorWithPage };
