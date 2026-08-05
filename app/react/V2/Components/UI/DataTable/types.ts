import type { ReactNode } from 'react';

export type SortDir = 'asc' | 'desc';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** CSS grid track width. Defaults to "1fr". */
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Column key for sorting. Omit for non-sortable columns. */
  sortKey?: string;
}

export interface DataTableSort {
  key: string;
  dir: SortDir;
}

export interface DataTableSelection<T> {
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
  disableRow?: (row: T) => boolean | string;
}

export interface DataTableReorder<T> {
  onReorder: (rows: T[]) => void;
}

export interface DataTableTree<T> {
  getSubRows: (row: T) => T[] | undefined;
}
