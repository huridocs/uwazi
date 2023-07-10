import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

interface PaginatorProps {
  currentPage: string;
  totalPages: string;
  buildUrl: (page: string) => string;
  preventScrollReset?: boolean;
}

const calculateMorePages = (currentPage: number, totalPages: number) => {
  let page = currentPage + 1;
  const pages = [];

  while (pages.length < 5) {
    if (page + 1 === totalPages) {
      break;
    }

    pages.push((page + 1).toString());
    page += 1;
  }

  return pages;
};

const Paginator = ({ currentPage, totalPages, buildUrl, preventScrollReset }: PaginatorProps) => {
  const page = Number(currentPage);
  const lastPage = Number(totalPages);
  const isFirstPage = page === 1;
  const isLastPage = currentPage === totalPages;
  const shouldDisplayShowMore = page + 1 !== lastPage && !isLastPage;
  const [showMore, setShowMore] = useState<Boolean>(lastPage - page < 6);

  return (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center">
        <li key="previous">
          {isFirstPage ? (
            <button
              type="button"
              disabled
              className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300"
            >
              <ChevronLeftIcon className="w-[17px]" />
            </button>
          ) : (
            <Link
              to={buildUrl((page - 1).toString())}
              preventScrollReset={preventScrollReset}
              className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              <Translate className="sr-only">Previous</Translate>
              <ChevronLeftIcon className="w-[17px]" />
            </Link>
          )}
        </li>

        {!isFirstPage && (
          <li key="first">
            <Link
              to={buildUrl('1')}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              1
            </Link>
          </li>
        )}

        {!isFirstPage && page - 1 !== 1 && (
          <li key={page - 1}>
            <Link
              to={buildUrl((page - 1).toString())}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              {page - 1}
            </Link>
          </li>
        )}

        <li key="current">
          <Link
            to={buildUrl(currentPage)}
            preventScrollReset={preventScrollReset}
            aria-current="page"
            className="px-3 py-2 leading-tight text-blue-600 bg-blue-50 border border-blue-300"
          >
            {currentPage}
          </Link>
        </li>

        {!isLastPage && page + 1 !== lastPage && (
          <li key={page + 1}>
            <Link
              to={buildUrl((page + 1).toString())}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              {page + 1}
            </Link>
          </li>
        )}

        {shouldDisplayShowMore &&
          (showMore ? (
            calculateMorePages(page, lastPage).map(pageNumber => (
              <li key={`more-${pageNumber}`}>
                <Link
                  to={buildUrl(pageNumber)}
                  preventScrollReset={preventScrollReset}
                  className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                >
                  {pageNumber}
                </Link>
              </li>
            ))
          ) : (
            <li key="more">
              <button
                onClick={() => setShowMore(true)}
                type="button"
                className="h-[35px] px-3 py-2 m-0 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              >
                <Translate className="sr-only">Show more</Translate>
                ...
              </button>
            </li>
          ))}

        {!isLastPage && (
          <li key="last">
            <Link
              to={buildUrl(totalPages)}
              preventScrollReset={preventScrollReset}
              className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              {totalPages}
            </Link>
          </li>
        )}

        <li key="next">
          {isLastPage ? (
            <button
              type="button"
              disabled
              className="block px-3 py-2 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300"
            >
              <ChevronRightIcon className="w-[17px]" />
            </button>
          ) : (
            <Link
              to={buildUrl((page + 1).toString())}
              preventScrollReset={preventScrollReset}
              className="block px-3 py-2 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              <Translate className="sr-only">Next</Translate>
              <ChevronRightIcon className="w-[17px]" />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export { Paginator };
