import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

interface PaginatorProps {
  currentPage: string;
  totalPages: string;
  pathname: string;
  otherParams?: string;
  preventScrollReset?: boolean;
}

const calculateMorePages = (currentPage: string, totalPages: string) => {
  let page = Number(currentPage);
  const pages = [];

  while (pages.length < 5) {
    if (page + 1 === Number(totalPages)) {
      break;
    }

    pages.push(Number(page + 1).toString());
    page += 1;
  }

  return pages;
};

const Paginator = ({
  currentPage,
  totalPages,
  pathname,
  otherParams,
  preventScrollReset,
}: PaginatorProps) => {
  const [showMore, setShowMore] = useState(false);
  const page = Number(currentPage);
  const isFirstPage = currentPage === '1';
  const isLastPage = currentPage === totalPages;

  const basepath = `${pathname}${otherParams ? `?${otherParams},` : '?'}`;
  const currentUrl = `${basepath}page=${currentPage}`;
  const lastUrl = isLastPage ? currentUrl : `${basepath}page=${totalPages}`;
  const prevUrl = isFirstPage ? currentUrl : `${basepath}page=${(page - 1).toString()}`;
  const nextUrl = `${basepath}page=${(page + 1).toString()}`;

  return (
    <nav aria-label="Pagination">
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <Link
            to={prevUrl}
            preventScrollReset={preventScrollReset}
            className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
          >
            <Translate className="sr-only">Previous</Translate>
            <ChevronLeftIcon className="w-[17px]" />
          </Link>
        </li>
        {isFirstPage ? undefined : (
          <li>
            <Link
              to={`${basepath}page=${1}`}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              1
            </Link>
          </li>
        )}
        <li>
          <Link
            to={currentUrl}
            preventScrollReset={preventScrollReset}
            aria-current="page"
            className="px-3 py-2 leading-tight text-blue-600 bg-blue-50 border border-blue-300"
          >
            {currentPage}
          </Link>
        </li>

        {showMore ? (
          calculateMorePages(currentPage, totalPages).map(pageNumber => (
            <li>
              <Link
                to={`${basepath}page=${pageNumber}`}
                preventScrollReset={preventScrollReset}
                className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              >
                {pageNumber}
              </Link>
            </li>
          ))
        ) : (
          <li>
            <button
              onClick={() => setShowMore(true)}
              type="button"
              className="h-[35px] px-3 py-2 m-0 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              <Translate className="sr-only">Show more</Translate>
              ...
            </button>
          </li>
        )}

        <li>
          <Link
            to={lastUrl}
            preventScrollReset={preventScrollReset}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
          >
            {totalPages}
          </Link>
        </li>
        <li>
          <Link
            to={nextUrl}
            preventScrollReset={preventScrollReset}
            className="block px-3 py-2 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
          >
            <Translate className="sr-only">Next</Translate>
            <ChevronRightIcon className="w-[17px]" />
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export { Paginator };
