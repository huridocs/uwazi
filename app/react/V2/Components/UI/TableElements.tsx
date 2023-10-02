/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-multi-comp */
import React, { HTMLProps, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import {
  ColumnDef,
  TableState,
  Row,
  Table as TableDef,
  SortingState,
  OnChangeFn,
} from '@tanstack/react-table';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { t } from 'app/I18N';

interface TableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  title?: string | React.ReactNode;
  footer?: string | React.ReactNode;
  initialState?: Partial<TableState>;
  enableSelection?: boolean;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  onSelection?: Dispatch<SetStateAction<Row<T>[]>>;
}

const IndeterminateCheckbox = ({
  indeterminate,
  className = '',
  id,
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) => {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading

    <label>
      <span className="sr-only">
        {id === 'checkbox-header'
          ? t('System', 'Select all', null, false)
          : t('System', 'Select', null, false)}
      </span>
      <input
        type="checkbox"
        ref={ref}
        className={`rounded cursor-pointer ${className}`}
        {...rest}
      />
    </label>
  );
};

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
      id: 'checkbox-header',
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
      id: row.id,
    }}
  />
);

export type { TableProps };
export { CheckBoxHeader, CheckBoxCell, getIcon };
