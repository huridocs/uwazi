/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-multi-comp */
import React, { HTMLProps, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import {
  ColumnDef,
  TableState,
  Row,
  Table as TableDef,
  SortingState,
  Header,
  PaginationState,
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
  setSorting?: Dispatch<SetStateAction<SortingState>>;
  onSelection?: Dispatch<SetStateAction<Row<T>[]>>;
  subRowsKey?: string;
  draggableRows?: boolean;
  onChange?: (rows: T[]) => void;
  pagination?: {
    state: PaginationState;
    setState: Dispatch<SetStateAction<PaginationState>>;
    autoResetPageIndex?: boolean;
  };
}

const IndeterminateCheckbox = ({
  indeterminate,
  className = '',
  id,
  disabled,
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
        className={`rounded cursor-pointer ${className} ${disabled ? 'opacity-50' : ''}`}
        disabled={disabled}
        {...rest}
      />
    </label>
  );
};

// eslint-disable-next-line comma-spacing
const getIcon = <T,>(header: Header<T, any>, sortedChanged: boolean) => {
  const sorting = !sortedChanged ? header.column.getIsSorted() : false;
  const testId = `${header.id}_${sorting.toString()}`;
  switch (sorting) {
    case false:
      return <ChevronUpDownIcon data-testid={testId} className="w-4" />;
    case 'asc':
      return <ChevronUpIcon data-testid={testId} className="w-4" />;
    case 'desc':
    default:
      return <ChevronDownIcon data-testid={testId} className="w-4" />;
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
      checked: row.getCanExpand()
        ? row.getIsAllSubRowsSelected() && row.getIsSelected()
        : row.getIsSelected(),
      disabled: !row.getCanSelect(),
      indeterminate: row.getIsSomeSelected() || row.getIsAllSubRowsSelected(),
      onChange: e => {
        row.getToggleSelectedHandler()(e);
        row.subRows.forEach(subRow => subRow.getToggleSelectedHandler()(e));
      },
      id: row.id,
    }}
  />
);

export type { TableProps };
export { CheckBoxHeader, CheckBoxCell, getIcon };
