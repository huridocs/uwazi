import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import _ from 'lodash';
import { Translate } from 'app/I18N';

interface PaginationProps {
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
}

const computeVisiblePages = (activePage: number, totalPages: number) => {
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
  return availablePages;
};

function pageLabel(array: number[], index: number, pageNumber: number) {
  return array[index - 1] + 2 < pageNumber ? `...${pageNumber}` : pageNumber;
}

const Pagination = ({ totalPages, setPage }: PaginationProps) => {
  const [activePage, setActivePage] = useState(1);
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);
  const [pageSize, setPageSize] = useState<number>(5);

  useEffect(() => {
    setVisiblePages(computeVisiblePages(activePage, totalPages));
  }, [activePage]);

  const changePage = (page: number) => {
    if (page !== activePage) {
      setActivePage(page);
      setPage(page);
    }
  };

  const gotToNextPage = () => {
    if (activePage !== totalPages) {
      changePage(activePage + 1);
    }
  };

  const gotToPreviousPage = () => {
    if (activePage !== 1) {
      changePage(activePage - 1);
    }
  };

  const handlePageChange = (e: React.MouseEvent<HTMLElement>) => {
    changePage(Number.parseInt(e.currentTarget.nodeValue!, 2));
  };

  return (
    <div className="table-pagination">
      <div>
        <div className="prev-table">
          <button
            type="button"
            className="page-button"
            onClick={gotToPreviousPage}
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
              onClick={handlePageChange}
              value={pageNumber}
            >
              {pageLabel(array, index, pageNumber)}
            </button>
          ))}
        </div>
        <div className="next-page">
          <button
            type="button"
            className="page-button"
            onClick={gotToNextPage}
            disabled={activePage === totalPages}
          >
            <Translate>Next</Translate>
          </button>
        </div>
      </div>
      <div>
        <span>Items per page</span>&nbsp;
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[5, 10, 20].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export { Pagination };
