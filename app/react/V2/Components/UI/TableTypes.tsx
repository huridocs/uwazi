/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-multi-comp */
import React, { Dispatch, SetStateAction } from 'react';
import {
  ColumnDef,
  CellContext,
  Column,
  TableState,
  Row,
  Table as TableDef,
} from '@tanstack/react-table';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { IndeterminateCheckbox } from './IndeterminateCheckbox';

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

// eslint-disable-next-line comma-spacing
const CheckBoxHeader = <T,>({ table }: { table: TableDef<T> }) => (
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

export type { TableProps, ColumnWithClassName, CellContextWithMeta };
export { CheckBoxHeader, CheckBoxCell, getIcon };
