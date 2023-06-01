/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-multi-comp */
import React, {
  HTMLProps,
  useEffect,
  useMemo,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import {
  flexRender,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnDef,
  CellContext,
  Column,
  TableState,
  Row,
} from '@tanstack/react-table';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type ColumnWithClassName<T> = ColumnDef<T, any> & {
  className?: string;
};

type CellContextWithMeta<T, U> = CellContext<T, U> & {
  column: Column<T> & { columnDef: ColumnWithClassName<T> };
};

interface TableProps<T> {
  columns: ColumnWithClassName<T>[];
  data: T[];
  title?: string | React.ReactNode;
  initialState?: Partial<TableState>;
  enableSelection?: boolean;
  onSelection?: Dispatch<SetStateAction<Row<T>[]>>;
}

const getIcon = (sorting: false | 'asc' | 'desc') => {
  switch (sorting) {
    case false:
      return <ChevronUpDownIcon className="w-4" />;
    case 'asc':
      return <ChevronUpIcon className="w-4" />;
    case 'desc':
    default:
      return <ChevronDownIcon className="w-4" />;
  }
};

const IndeterminateCheckbox = ({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) => {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <input type="checkbox" ref={ref} className={`rounded cursor-pointer ${className}`} {...rest} />
  );
};

const CheckBoxHeader = ({ table }) => (
  <IndeterminateCheckbox
    {...{
      checked: table.getIsAllRowsSelected(),
      indeterminate: table.getIsSomeRowsSelected(),
      onChange: table.getToggleAllRowsSelectedHandler(),
    }}
  />
);

// eslint-disable-next-line comma-spacing
const CheckBoxCell = <T,>({ row }: { row: Row<T> }) => (
  <IndeterminateCheckbox
    {...{
      checked: row.getIsSelected(),
      disabled: !row.getCanSelect(),
      indeterminate: row.getIsSomeSelected(),
      onChange: row.getToggleSelectedHandler(),
    }}
  />
);

// eslint-disable-next-line comma-spacing
const Table = <T,>({
  columns,
  data,
  title,
  initialState,
  enableSelection,
  onSelection,
}: TableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>(initialState?.sorting || []);
  const [rowSelection, setRowSelection] = useState({});

  const memoizedColumns = useMemo(
    () => [
      ...(enableSelection
        ? [
            {
              id: 'select',
              header: CheckBoxHeader,
              cell: CheckBoxCell,
            },
          ]
        : []),
      ...columns,
    ],
    [columns, enableSelection]
  );

  const memoizedData = useMemo<T[]>(() => data, [data]);

  const table = useReactTable({
    columns: memoizedColumns,
    data: memoizedData,
    state: {
      sorting,
      ...(enableSelection ? { rowSelection } : {}),
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: enableSelection ? setRowSelection : () => undefined,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().flatRows;

    if (onSelection) {
      onSelection(selectedRows);
    }
  }, [onSelection, rowSelection, table]);

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-sm text-left">
        {title && (
          <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white">
            {title}
          </caption>
        )}

        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const isSortable = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`px-6 py-3 ${
                      (header.column.columnDef as ColumnWithClassName<T>).className
                    }`}
                  >
                    <div
                      className={`inline-flex ${isSortable ? 'cursor-pointer select-none' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {isSortable && getIcon(header.column.getIsSorted())}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="bg-white border-b">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export type { CellContextWithMeta, ColumnWithClassName, TableProps };

export { Table };
