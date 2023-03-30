/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo } from 'react';
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
const GroupTable = ({ columns, data, title, initialGroupBy }: GroupTableProps) => {
  const memoizedColumns = useMemo(() => columns, [columns]);
  const memoizedData = useMemo(() => data, [data]);
  const tableInstance = useTable(
    {
      columns: memoizedColumns,
      data: memoizedData,
      expandSubRows: true,
      initialState: {
        groupBy: initialGroupBy,
      },
    },

    useGroupBy,
    useSortBy,
    useExpanded,
    useRowSelect,
    useRowState
  );
  const { getTableProps, getTableBodyProps, rows, prepareRow } = tableInstance;

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

  useEffect(() => tableInstance.toggleAllRowsExpanded(true), []);

  return (
    <FlowbiteTable {...getTableProps()}>
      <FlowbiteTable.Body {...getTableBodyProps()} className="text-gray-900">
        {rows.map(row => {
          prepareRow(row);
          return (
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
        })}
      </FlowbiteTable.Body>
    </FlowbiteTable>
  );
};

export { GroupTable };
