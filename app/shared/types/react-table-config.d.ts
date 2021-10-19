import {
  UseFiltersColumnOptions,
  UseFiltersColumnProps,
  UseFiltersInstanceProps,
  UseFiltersOptions,
  UseFiltersState,
  UsePaginationInstanceProps,
  UsePaginationOptions,
  UsePaginationState,
} from 'react-table';

interface CustomColumn {
  className?: string;
}

declare module 'react-table' {
  export interface TableOptions<D extends object>
    extends UseExpandedOptions<D>,
      UseFiltersOptions<D>,
      UsePaginationOptions<D> {}

  export interface TableInstance<D>
    extends UseColumnOrderInstanceProps<D>,
      UseExpandedInstanceProps<D>,
      UseFiltersInstanceProps<D>,
      UsePaginationInstanceProps<D> {}

  export interface TableState<D>
    extends UseColumnOrderState<D>,
      UseExpandedState<D>,
      UseFiltersState<D>,
      UsePaginationState<D> {}

  export interface ColumnInterface<D extends object = {}>
    extends UseFiltersColumnOptions<D>,
      UseFiltersColumnOptions<D>,
      CustomColumn {}

  export interface ColumnInstance<D extends object = {}> extends UseFiltersColumnProps<D> {}
}
