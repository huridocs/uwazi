/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef } from 'react';
import { Row, Table, HeaderContext } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
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

  const checkbox = (
    <input
      type="checkbox"
      ref={ref}
      className={checkboxInputClassName}
      disabled={disabled}
      onChange={onChange}
      key={row.id}
      id={row.id}
      checked={checked}
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
const IndeterminateCheckboxHeader = <T,>({
  table,
  checkboxId = 'checkbox-header',
}: {
  table: Table<T>;
  checkboxId?: string;
}) => {
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
        className={checkboxInputClassName}
        onChange={onChange}
        key={checkboxId}
        id={checkboxId}
      />
    </label>
  );
};

const IndeterminateCheckboxHeaderCell = <T extends unknown>({
  table,
  column,
}: HeaderContext<T, unknown>) => {
  const checkboxId =
    (column.columnDef.meta as { selectAllCheckboxId?: string } | undefined)?.selectAllCheckboxId ??
    'checkbox-header';

  return <IndeterminateCheckboxHeader table={table} checkboxId={checkboxId} />;
};

export { IndeterminateCheckboxRow, IndeterminateCheckboxHeader, IndeterminateCheckboxHeaderCell };
