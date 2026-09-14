import React, { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';

const pageLinkClass =
  'px-3 py-1.5 leading-snug text-ink-muted bg-paper border-r border-border border-y hover:bg-warm hover:text-ink';
const pageEdgeClass = 'block px-3 py-1.5 leading-snug text-ink-muted bg-paper border border-border';

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
            <button type="button" disabled className={`${pageEdgeClass} ml-0 rounded-l-sm`}>
              <ChevronLeftIcon className="w-4.25" />
              <Translate className="sr-only">Previous</Translate>
            </button>
          ) : (
            <Link
              to={buildUrl((currentPage - 1).toString())}
              preventScrollReset={preventScrollReset}
              className={`${pageEdgeClass} ml-0 rounded-l-sm hover:bg-warm hover:text-ink`}
            >
              <Translate className="sr-only">Previous</Translate>
              <ChevronLeftIcon className="w-4.25" />
            </Link>
          )}
        </li>

        {!isFirstPage && (
          <li key="first">
            <Link
              to={buildUrl('1')}
              preventScrollReset={preventScrollReset}
              aria-current="page"
              className={pageLinkClass}
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
              className={pageLinkClass}
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
            className="px-3 py-1.5 leading-snug text-ink border-r border-border border-y bg-warm"
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
              className={pageLinkClass}
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
                  className={pageLinkClass}
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
                className={`h-8.75 m-0 ${pageLinkClass}`}
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
              className="px-3 py-1.5 leading-snug text-ink-muted bg-paper border-border border-y hover:bg-warm hover:text-ink"
            >
              {totalPages}
            </Link>
          </li>
        )}

        <li key="next">
          {isLastPage ? (
            <button type="button" disabled className={`${pageEdgeClass} rounded-r-sm`}>
              <ChevronRightIcon className="w-4.25" />
              <Translate className="sr-only">Next</Translate>
            </button>
          ) : (
            <Link
              to={buildUrl((currentPage + 1).toString())}
              preventScrollReset={preventScrollReset}
              className={`${pageEdgeClass} rounded-r-sm hover:bg-warm hover:text-ink`}
            >
              <Translate className="sr-only">Next</Translate>
              <ChevronRightIcon className="w-4.25" />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export { Paginator };
