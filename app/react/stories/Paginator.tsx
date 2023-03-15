import React from 'react';

interface PaginatorProps {
  page: string | number;
  onPreviousClick: () => any;
  onNextClick: () => any;
}

const Paginator = ({ page, onNextClick, onPreviousClick }: PaginatorProps) => (
  <div className="inline-flex items-center">
    <button
      type="button"
      onClick={onPreviousClick}
      className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700"
    >
      <span className="sr-only">Previous page</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="3"
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
    <p className="block px-3 py-2 leading-tight font-medium text-primary-700 bg-primary-100 border border-gray-300">
      {page}
    </p>
    <button
      type="button"
      onClick={onNextClick}
      className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700"
    >
      <span className="sr-only">Next Page</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="3"
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  </div>
);

export { Paginator };
