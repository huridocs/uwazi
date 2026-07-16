import type { DataTableColumn } from './types.js';

const DEFAULT_COLUMN_REM = 9;
const GAP_REM = 0.75;
const PADDING_REM = 2;

const parseColumnWidthRem = (width?: string): number => {
  if (!width?.endsWith('rem')) return DEFAULT_COLUMN_REM;
  const rem = parseFloat(width);
  return Number.isNaN(rem) ? DEFAULT_COLUMN_REM : rem;
};

const tableMinWidthRem = <T>(columns: DataTableColumn<T>[]): number =>
  columns.reduce((sum, column) => sum + parseColumnWidthRem(column.width), 0) +
  Math.max(columns.length - 1, 0) * GAP_REM +
  PADDING_REM;

export { tableMinWidthRem };
