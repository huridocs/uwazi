import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import _ from 'lodash';
import { Translate } from 'app/I18N';

interface PaginationProps {
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
}

const Pagination = ({ totalPages, setPage }: PaginationProps) => {
  const [activePage, setActivePage] = useState(1);
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);

  const computeVisiblePages = () => {
    let availablePages;
    if (totalPages < 7) {
      availablePages = _.times(Math.min(totalPages, 6));
    } else if (activePage % 5 >= 0 && activePage > 4 && activePage + 2 < totalPages) {
      availablePages = [1, activePage - 1, activePage, activePage + 1, totalPages];
    } else if (activePage + 2 >= totalPages) {
      availablePages = [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      availablePages = [1, 2, 3, 4, 5, totalPages];
    }
    setVisiblePages(availablePages);
  };

  useEffect(computeVisiblePages, [activePage]);

  const changePage = (page: number) => {
    if (page === activePage) {
      return;
    }
    setActivePage(page);
    setPage(page);
  };

  return (
    <div className="table-pagination">
      <div className="prev-table">
        <button
          type="button"
          className="page-button"
          onClick={() => {
            if (activePage === 1) return;
            changePage(activePage - 1);
          }}
          disabled={activePage === 1}
        >
          <Translate>Previous</Translate>
        </button>
      </div>
      <div className="visible-pages">
        {visiblePages.map((pageNumber, index, array) => (
          <button
            type="button"
            key={pageNumber}
            className={activePage === pageNumber ? 'page-button active' : 'page-button'}
            onClick={() => changePage(pageNumber)}
          >
            {array[index - 1] + 2 < pageNumber ? `...${pageNumber}` : pageNumber}
          </button>
        ))}
      </div>
      <div className="next-page">
        <button
          type="button"
          className="page-button"
          onClick={() => {
            if (activePage === totalPages) return;
            changePage(activePage + 1);
          }}
          disabled={activePage === totalPages}
        >
          <Translate>Next</Translate>
        </button>
      </div>
    </div>
  );
};

export { Pagination };
