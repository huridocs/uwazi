/* eslint-disable react/button-has-type */
import React, { Dispatch, SetStateAction } from 'react';
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

const TablePagination = ({ pagination, table }: TablePaginationProps) => {
  const lastPage = table.getPageCount();
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const currentPage = table.getState().pagination.pageIndex + 1;

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

        {/* {!isFirstPage && currentPage - 1 !== 1 && (
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
        )} */}

        {/* <li key="current">
          <Link
            to={buildUrl(currentPage.toString())}
            preventScrollReset={preventScrollReset}
            aria-current="page"
            className="px-3 py-1.5 leading-snug text-blue-600 border-r border-blue-300 border-y bg-blue-50"
          >
            {currentPage}
          </Link>
        </li> */}

        {/* {!isLastPage && currentPage + 1 !== totalPages && (
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
        )} */}

        {/* {shouldDisplayShowMore &&
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
          ))} */}

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

  //   return pagination ? (
  //     <div className="flex gap-2 items-center">
  //       <button
  //         className="p-1 rounded border"
  //         onClick={() => table.setPageIndex(0)}
  //         disabled={!table.getCanPreviousPage()}
  //       >
  //         {'<<'}
  //       </button>
  //       <button
  //         className="p-1 rounded border"
  //         onClick={() => table.previousPage()}
  //         disabled={!table.getCanPreviousPage()}
  //       >
  //         {'<'}
  //       </button>
  //       <button
  //         className="p-1 rounded border"
  //         onClick={() => table.nextPage()}
  //         disabled={!table.getCanNextPage()}
  //       >
  //         {'>'}
  //       </button>
  //       <button
  //         className="p-1 rounded border"
  //         onClick={() => table.setPageIndex(lastPage)}
  //         disabled={!table.getCanNextPage()}
  //       >
  //         {'>>'}
  //       </button>
  //       <span className="flex gap-1 items-center">
  //         <div>Page</div>
  //         <strong>
  //           {table.getState().pagination.pageIndex + 1} of {table.getPageCount().toLocaleString()}
  //         </strong>
  //       </span>
  //       <span className="flex gap-1 items-center">
  //         | Go to page:
  //         <input
  //           type="number"
  //           defaultValue={table.getState().pagination.pageIndex + 1}
  //           onChange={e => {
  //             const page = e.target.value ? Number(e.target.value) - 1 : 0;
  //             table.setPageIndex(page);
  //           }}
  //           className="p-1 w-16 rounded border"
  //         />
  //       </span>
  //       <select
  //         value={table.getState().pagination.pageSize}
  //         onChange={e => {
  //           table.setPageSize(Number(e.target.value));
  //         }}
  //       >
  //         {[10, 20, 30, 40, 50].map(pageSize => (
  //           <option key={pageSize} value={pageSize}>
  //             Show {pageSize}
  //           </option>
  //         ))}
  //       </select>
  //     </div>
  //   ) : (
  //     <div />
  //   );
};

export type { TablePaginationProps };
export { TablePagination };
