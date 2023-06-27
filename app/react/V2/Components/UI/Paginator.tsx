import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

interface PaginatorProps {
  currentPage: string;
  totalPages: string;
  pathname: string;
  otherParams?: string;
}

const Paginator = ({ currentPage, totalPages, pathname, otherParams }: PaginatorProps) => {
  const basepath = `${pathname}${otherParams ? `?${otherParams},` : '?'}`;
  const currentUrl = `${basepath}page=${currentPage}`;
  const prevUrl = `${basepath}page=${(Number(currentPage) - 1).toString()}`;
  const lastUrl = `${basepath}page=${totalPages}`;
  const nextUrl = `${basepath}page=${(Number(currentPage) + 1).toString()}`;

  return (
    <nav aria-label="Pagination">
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <a
            href={prevUrl}
            className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
          >
            <Translate className="sr-only">Previous</Translate>
            <ChevronLeftIcon className="w-[17px]" />
          </a>
        </li>
        {/* <li>
        <a className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700">
          1
        </a>
      </li>
      <li>
        <a className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700">
          2
        </a>
      </li> */}
        <li>
          <a
            href={currentUrl}
            aria-current="page"
            className="z-10 px-3 py-2 leading-tight text-blue-600 bg-blue-50 border border-blue-300"
          >
            {currentPage}
          </a>
        </li>
        {/* <li>
        <a className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700">
          4
        </a>
      </li>*/}
        <li>
          <a
            href={lastUrl}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
          >
            {totalPages}
          </a>
        </li>
        <li>
          <a
            href={nextUrl}
            className="block px-3 py-2 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
          >
            <Translate className="sr-only">Next</Translate>
            <ChevronRightIcon className="w-[17px]" />
          </a>
        </li>
      </ul>
    </nav>
  );
};

export { Paginator };
