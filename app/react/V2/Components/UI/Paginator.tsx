import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
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
  const isFirstPage = currentPage === 1;
  const isLastPage = totalPages < 1 || currentPage === totalPages;
  const shouldDisplayShowMore = currentPage + 1 !== totalPages && !isLastPage;
  const [showMore, setShowMore] = useState<Boolean>(totalPages - currentPage < 6);

  return (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center">
        <li key="previous">
          {isFirstPage ? (
            <button
              type="button"
              disabled
              className="block px-3 py-1.5 ml-0 leading-snug text-gray-500 bg-white border border-gray-300 rounded-l-[4px]"
            >
              <ChevronLeftIcon className="w-[17px]" />
              <Translate className="sr-only">Previous</Translate>
            </button>
          ) : (
            <Link
              to={buildUrl((currentPage - 1).toString())}
              preventScrollReset={preventScrollReset}
              className="block px-3 py-1.5 ml-0 leading-snug text-gray-500 bg-white border border-gray-300 rounded-l-[4px] hover:bg-gray-100 hover:text-gray-700"
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
              className="px-3 py-1.5 leading-snug text-gray-500 bg-white border-r border-gray-300 border-y hover:bg-gray-100 hover:text-gray-700"
            >
              1
            </Link>
          </li>
        )}

        {!isFirstPage && currentPage - 1 !== 1 && (
          <li key={currentPage - 1}>
            <Link
              to={buildUrl((currentPage - 1).toString())}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className="px-3 py-1.5 leading-snug text-gray-500 bg-white border-r border-gray-300 border-y hover:bg-gray-100 hover:text-gray-700"
            >
              {currentPage - 1}
            </Link>
          </li>
        )}

        <li key="current">
          <Link
            to={buildUrl(currentPage.toString())}
            preventScrollReset={preventScrollReset}
            aria-current="page"
            className="px-3 py-1.5 leading-snug text-blue-600 border-r border-blue-300 border-y bg-blue-50"
          >
            {currentPage}
          </Link>
        </li>

        {!isLastPage && currentPage + 1 !== totalPages && (
          <li key={currentPage + 1}>
            <Link
              to={buildUrl((currentPage + 1).toString())}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className="px-3 py-1.5 leading-snug text-gray-500 bg-white border-r border-gray-300 border-y hover:bg-gray-100 hover:text-gray-700"
            >
              {currentPage + 1}
            </Link>
          </li>
        )}

        {shouldDisplayShowMore &&
          (showMore ? (
            calculateMorePages(currentPage, totalPages).map(pageNumber => (
              <li key={`more-${pageNumber}`}>
                <Link
                  to={buildUrl(pageNumber)}
                  preventScrollReset={preventScrollReset}
                  className="px-3 py-1.5 leading-snug text-gray-500 bg-white border-r border-gray-300 border-y hover:bg-gray-100 hover:text-gray-700"
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
                className="h-[35px] px-3 py-1.5 m-0 leading-snug text-gray-500 bg-white border-y border-r border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              >
                <Translate className="sr-only">Show more</Translate>
                ...
              </button>
            </li>
          ))}

        {!isLastPage && (
          <li key="last">
            <Link
              to={buildUrl(totalPages.toString())}
              preventScrollReset={preventScrollReset}
              className="px-3 py-1.5 leading-snug text-gray-500 bg-white border-gray-300 border-y hover:bg-gray-100 hover:text-gray-700"
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
              className="block px-3 py-1.5 leading-snug text-gray-500 bg-white border border-gray-300 rounded-r-[4px]"
            >
              <ChevronRightIcon className="w-[17px]" />
              <Translate className="sr-only">Next</Translate>
            </button>
          ) : (
            <Link
              to={buildUrl((currentPage + 1).toString())}
              preventScrollReset={preventScrollReset}
              className="block px-3 py-1.5 leading-snug text-gray-500 bg-white border border-gray-300 rounded-r-[4px] hover:bg-gray-100 hover:text-gray-700"
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
