import {
  UseFiltersColumnOptions,
  UseGlobalFiltersColumnOptions,
  UseGroupByColumnOptions,
  UseResizeColumnsColumnOptions,
  UseSortByColumnOptions,
} from 'react-table';

interface CustomColumn {
  className?: string;
}

declare module 'react-table' {
  export interface ColumnInterface<D extends object = {}>
    extends UseFiltersColumnOptions<D>,
      UseGlobalFiltersColumnOptions<D>,
      UseGroupByColumnOptions<D>,
      UseResizeColumnsColumnOptions<D>,
      UseSortByColumnOptions<D>,
      CustomColumn {}
}
