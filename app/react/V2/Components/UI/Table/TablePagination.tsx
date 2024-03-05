/* eslint-disable react/button-has-type */
import React, { Dispatch, SetStateAction } from 'react';
import { PaginationState, Table } from '@tanstack/react-table';

type TablePaginationProps = {
  table: Table<any>;
  pagination?: {
    state: PaginationState;
    setState: Dispatch<SetStateAction<PaginationState>>;
    autoResetPageIndex?: boolean;
  };
};

const TablePagination = ({ pagination, table }: TablePaginationProps) => {
  const lastPage = table.getPageCount() - 1;

  return pagination ? (
    <div className="flex gap-2 items-center">
      <button
        className="p-1 rounded border"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        {'<<'}
      </button>
      <button
        className="p-1 rounded border"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {'<'}
      </button>
      <button
        className="p-1 rounded border"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {'>'}
      </button>
      <button
        className="p-1 rounded border"
        onClick={() => table.setPageIndex(lastPage)}
        disabled={!table.getCanNextPage()}
      >
        {'>>'}
      </button>
      <span className="flex gap-1 items-center">
        <div>Page</div>
        <strong>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount().toLocaleString()}
        </strong>
      </span>
      <span className="flex gap-1 items-center">
        | Go to page:
        <input
          type="number"
          defaultValue={table.getState().pagination.pageIndex + 1}
          onChange={e => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            table.setPageIndex(page);
          }}
          className="p-1 w-16 rounded border"
        />
      </span>
      <select
        value={table.getState().pagination.pageSize}
        onChange={e => {
          table.setPageSize(Number(e.target.value));
        }}
      >
        {[10, 20, 30, 40, 50].map(pageSize => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <div />
  );
};

export type { TablePaginationProps };
export { TablePagination };
