/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef } from 'react';
import { Row, Table } from '@tanstack/react-table';
import { Translate } from 'app/I18N';

const IndeterminateCheckboxRow = <T extends { rowId: string }>({ row }: { row: Row<T> }) => {
  const ref = useRef<HTMLInputElement>(null!);
  const checked = row.getIsSelected() || row.getIsAllSubRowsSelected();
  const disabled = !row.getCanSelect();
  const indeterminate = row.getIsSomeSelected();
  const onChange = row.getToggleSelectedHandler();

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !checked && indeterminate;
    }
  }, [ref, indeterminate, checked]);

  return (
    <label>
      <Translate className="sr-only">Select</Translate>
      <input
        type="checkbox"
        ref={ref}
        className="bg-gray-50 rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200"
        disabled={disabled}
        onChange={onChange}
        key={row.id}
        id={row.id}
        checked={checked}
      />
    </label>
  );
};

// eslint-disable-next-line comma-spacing
const IndeterminateCheckboxHeader = <T,>({ table }: { table: Table<T> }) => {
  const ref = useRef<HTMLInputElement>(null!);
  const checked = table.getIsAllRowsSelected();
  const indeterminate = table.getIsSomeRowsSelected();
  const onChange = table.getToggleAllRowsSelectedHandler();

  useEffect(() => {
    ref.current.checked = Boolean(checked);
    ref.current.indeterminate = Boolean(indeterminate && !checked);
  }, [ref, indeterminate, checked]);

  return (
    <label>
      <Translate className="sr-only">Select all</Translate>
      <input
        type="checkbox"
        ref={ref}
        className="bg-gray-50 rounded border-gray-300 cursor-pointer"
        onChange={onChange}
        key="checkbox-header"
        id="checkbox-header"
      />
    </label>
  );
};

export { IndeterminateCheckboxRow, IndeterminateCheckboxHeader };
