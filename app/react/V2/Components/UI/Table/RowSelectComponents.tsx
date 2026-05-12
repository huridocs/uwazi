/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef } from 'react';
import { Row, Table } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

const IndeterminateCheckboxRow = <
  T extends { rowId: string; disableRowSelection?: string | boolean | React.ReactNode },
>({
  row,
}: {
  row: Row<T>;
}) => {
  const ref = useRef<HTMLInputElement>(null!);
  const checked = row.getIsSelected();
  const disabled = !row.getCanSelect();
  const onChange = row.getToggleSelectedHandler();
  const disableReason = row.original.disableRowSelection;
  const checkboxStyle = {
    backgroundColor: 'var(--color-theme-control-bg)',
    borderColor: 'var(--color-theme-control-border)',
  };
  useEffect(() => {
    ref.current.checked = Boolean(checked);
  }, [ref, checked]);

  const checkbox = (
    <input
      type="checkbox"
      ref={ref}
      className="cursor-pointer rounded-sm disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onChange={onChange}
      key={row.id}
      id={row.id}
      checked={checked}
      style={checkboxStyle}
    />
  );

  return (
    <label>
      <Translate className="sr-only">Select</Translate>
      {disabled && typeof disableReason !== 'boolean' ? (
        <Tooltip content={<div className="w-40 text-xs text-ink-secondary">{disableReason}</div>}>
          <span>{checkbox}</span>
        </Tooltip>
      ) : (
        checkbox
      )}
    </label>
  );
};

// eslint-disable-next-line comma-spacing
const IndeterminateCheckboxHeader = <T,>({ table }: { table: Table<T> }) => {
  const ref = useRef<HTMLInputElement>(null!);
  const checked = table.getIsAllRowsSelected();
  const indeterminate = table.getIsSomeRowsSelected();
  const onChange = table.getToggleAllRowsSelectedHandler();
  const checkboxStyle = {
    backgroundColor: 'var(--color-theme-control-bg)',
    borderColor: 'var(--color-theme-control-border)',
  };

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
        className="cursor-pointer rounded-sm"
        onChange={onChange}
        key="checkbox-header"
        id="checkbox-header"
        style={checkboxStyle}
      />
    </label>
  );
};

export { IndeterminateCheckboxRow, IndeterminateCheckboxHeader };
