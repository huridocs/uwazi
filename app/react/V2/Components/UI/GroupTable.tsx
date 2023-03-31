/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react';
import {
  Column,
  useRowSelect,
  useRowState,
  useTable,
  useSortBy,
  UseSortByOptions,
  UseSortByColumnProps,
  useGroupBy,
  useExpanded,
  Cell,
  Row,
  usePagination,
} from 'react-table';

import { Table as FlowbiteTable } from 'flowbite-react';

type TableColumn<T extends object> = Column<T> &
  UseSortByOptions<T> &
  Partial<UseSortByColumnProps<T>> & {
    disableSortBy?: boolean;
    className?: string;
  };

interface GroupTableProps {
  columns: ReadonlyArray<TableColumn<any>>;
  data: { [key: string]: any }[];
  initialGroupBy: string[];
}
interface RowComponentProps {
  row: Row;
  columns: readonly TableColumn<any>[];
}
function cellContent(cell: Cell<any, any>, row: Row<any>): React.ReactNode {
  let content;
  switch (true) {
    case cell.isGrouped:
      content = (
        <span
          className="p-5 text-lg font-semibold text-left text-gray-900 bg-white"
          {...row.getToggleRowExpandedProps()}
        >
          {cell.render('Cell')}
        </span>
      );
      break;
    case cell.isAggregated:
      content = cell.render('Aggregated');
      break;
    case cell.isPlaceholder:
      content = '';
      break;
    default:
      content = cell.render('Cell');
  }
  return content;
}

const RowComponent = ({ row, columns }: RowComponentProps) => (
  <>
    <FlowbiteTable.Row {...row.getRowProps()}>
      {row.cells.map(cell => {
        const content = cellContent(cell, row);
        return content !== '' ? (
          <FlowbiteTable.Cell {...cell.getCellProps()}>{content}</FlowbiteTable.Cell>
        ) : null;
      })}
    </FlowbiteTable.Row>
    {row.subRows.length > 0 && row.isExpanded ? (
      <FlowbiteTable.Row className="text-xs text-gray-700 uppercase bg-gray-51 dark:bg-gray-700 dark:text-gray-400">
        {columns.map(column =>
          column.disableGroupBy ? (
            <FlowbiteTable.Cell className={column.className}>
              <span>{column.Header?.toString()}</span>
            </FlowbiteTable.Cell>
          ) : null
        )}
      </FlowbiteTable.Row>
    ) : null}
  </>
);
const GroupTable = ({ columns, data, initialGroupBy }: GroupTableProps) => {
  const memoizedColumns = useMemo(() => columns, [columns]);
  //const memoizedData = useMemo(() => data, [data]);
  const tableInstance = useTable(
    {
      columns: memoizedColumns,
      data,
      expandSubRows: true,
      autoResetExpanded: false,
      autoResetPage: false,
      initialState: {
        groupBy: initialGroupBy,
        pageSize: 1000,
      },
    },

    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect,
    useRowState
  );
  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;
  React.useMemo(() => tableInstance.toggleAllRowsExpanded(true), [tableInstance]);

  const RowTable = React.memo(RowComponent);
  return (
    <>
      <FlowbiteTable {...getTableProps()}>
        <FlowbiteTable.Body {...getTableBodyProps()} className="text-gray-900">
          {page.map(row => {
            prepareRow(row);
            return <RowTable row={row} columns={columns} />;
          })}
        </FlowbiteTable.Body>
      </FlowbiteTable>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const newPage = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(newPage);
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSizeOption => (
            <option key={pageSizeOption} value={pageSizeOption}>
              Show {pageSizeOption}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export { GroupTable };
