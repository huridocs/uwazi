/* eslint-disable react/button-has-type */
import React, { Dispatch, SetStateAction, useState } from 'react';
import { PaginationState, Table } from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

type TablePaginationProps = {
  table: Table<any>;
  pagination?: {
    state: PaginationState;
    setState: Dispatch<SetStateAction<PaginationState>>;
    autoResetPageIndex?: boolean;
  };
};

const calculateMorePagesForwards = (currentPage: number, totalPages: number) => {
  let page = currentPage;
  const pages = [];

  while (pages.length < 5) {
    if (page + 1 === totalPages) {
      break;
    }

    pages.push(page + 1);
    page += 1;
  }

  return pages;
};

const calculateMorePagesBackwards = (currentPage: number, totalPages: number) => {
  let page = currentPage;
  const pages = [];

  while (pages.length < 5) {
    if (page + 1 === totalPages) {
      break;
    }

    pages.push(page + 1);
    page += 1;
  }

  return pages;
};

const TablePagination = ({ pagination, table }: TablePaginationProps) => {
  const [showMore, setShowMore] = useState(false);
  const lastPage = table.getPageCount();
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const shouldDisplayShowMore = currentPage !== lastPage && canNext;

  return pagination ? (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center text-xs">
        <li key="previous">
          <button
            type="button"
            disabled={!canPrevious}
            onClick={() => table.previousPage()}
            className="block px-3 py-1.5 ml-0 leading-snug text-gray-500 bg-white border border-gray-300 rounded-l-[4px]"
          >
            <ChevronLeftIcon className="w-[17px]" />
            <Translate className="sr-only">Previous</Translate>
          </button>
        </li>

        <li key="first">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrevious}
            aria-current="page"
            className={`block px-3 py-1.5 ml-0 leading-snug bg-white border ${!canPrevious ? 'text-primary-500 border-primary-300' : 'text-gray-500 border-gray-300'}`}
          >
            1
          </button>
        </li>

        {currentPage && currentPage !== 1 && currentPage !== lastPage && (
          <li key="current">
            <button
              aria-current="page"
              className="block px-3 py-1.5 ml-0 leading-snug bg-white border text-primary-500 border-primary-300"
            >
              {currentPage}
            </button>
          </li>
        )}

        {shouldDisplayShowMore &&
          (showMore ? (
            calculateMorePagesForwards(currentPage, lastPage).map(pageNumber => (
              <li key={`more-${pageNumber}`}>
                <button
                  onClick={() => table.setPageIndex(pageNumber - 1)}
                  aria-current="page"
                  className={`block px-3 py-1.5 ml-0 leading-snug bg-white border ${currentPage === pageNumber ? 'text-primary-500 border-primary-300' : 'text-gray-500 border-gray-300'}`}
                >
                  {pageNumber}
                </button>
              </li>
            ))
          ) : (
            <li key="more">
              <button
                onClick={() => setShowMore(!showMore)}
                type="button"
                className="px-3 py-1.5 m-0 leading-snug text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              >
                <Translate className="sr-only">Show more</Translate>
                ...
              </button>
            </li>
          ))}

        <li key="last">
          <button
            onClick={() => table.setPageIndex(lastPage - 1)}
            disabled={!canNext}
            aria-current="page"
            className={`block px-3 py-1.5 ml-0 leading-snug bg-white border ${!canNext ? 'text-primary-500 border-primary-300' : 'text-gray-500 border-gray-300'}`}
          >
            {lastPage}
          </button>
        </li>

        <li key="next">
          <button
            type="button"
            disabled={!canNext}
            onClick={() => table.nextPage()}
            className="block px-3 py-1.5 leading-snug text-gray-500 bg-white border border-gray-300 rounded-r-[4px]"
          >
            <ChevronRightIcon className="w-[17px]" />
            <Translate className="sr-only">Next</Translate>
          </button>
        </li>
      </ul>
    </nav>
  ) : (
    <div />
  );
};

export type { TablePaginationProps };
export { TablePagination };
