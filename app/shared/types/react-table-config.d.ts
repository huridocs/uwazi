import {
  UseFiltersColumnOptions,
  UseFiltersColumnProps,
  UseFiltersInstanceProps,
  UseFiltersOptions,
  UseFiltersState,
  UsePaginationInstanceProps,
  UsePaginationOptions,
  UsePaginationState,
  UseRowSelectInstanceProps,
  UseRowSelectOptions,
  UseRowSelectState,
  UseRowStateState,
  UseSortByState,
  UseRowStateRowProps,
  UseRowStateOptions,
  UseSortByOptions,
  UseRowStateCellProps,
  UseSortByColumnOptions,
  UseSortByColumnProps,
  UseGroupByRowProps,
  UseExpandedHooks,
  UseExpandedInstanceProps,
  UseExpandedOptions,
  UseExpandedRowProps,
  UseExpandedState,
} from 'react-table';

interface CustomColumn {
  className?: string;
}

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    action?: Function;
    headerClassName?: string;
    contentClassName?: string;
    data?: any;
  }
}

declare module 'react-table' {
  export interface Hooks<D extends object = {}>
    extends UseExpandedHooks<D>,
      UseGroupByHooks<D>,
      UseRowSelectHooks<D>,
      UseSortByHooks<D> {}

  export interface TableOptions<D extends object>
    extends UseExpandedOptions<D>,
      UseFiltersOptions<D>,
      UseRowSelectOptions<D>,
      UseRowStateOptions<D>,
      UseGroupByOptions<D>,
      UseSortByOptions<D>,
      UsePaginationOptions<D> {}

  export interface TableInstance<D>
    extends UseColumnOrderInstanceProps<D>,
      UseExpandedInstanceProps<D>,
      UseFiltersInstanceProps<D>,
      UseRowSelectInstanceProps<D>,
      UseRowStateInstanceProps<D>,
      UseGroupByInstanceProps<D>,
      UseSortByInstanceProps<D>,
      UsePaginationInstanceProps<D> {}

  export interface TableState<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseColumnOrderState<D>,
      UseExpandedState<D>,
      UseFiltersState<D>,
      UsePaginationState<D>,
      UseRowSelectState<D>,
      UseRowStateState<D>,
      UseGroupByState<D>,
      UseSortByState<D>,
      UsePaginationState<D> {}

  export interface ColumnInterface<D extends object = {}>
    extends UseFiltersColumnOptions<D>,
      UseFiltersColumnOptions<D>,
      UseRowSelectOptions<D>,
      UseGroupByColumnOptions<D>,
      UseSortByColumnOptions<D>,
      CustomColumn {}

  interface Row<D extends object = {}>
    extends UseExpandedRowProps<D>,
      UseGroupByRowProps<D>,
      UseRowSelectRowProps<D>,
      UseRowStateRowProps<D>,
      UseRowStateCellProps<D>,
      UseSortByColumnProps<D> {}

  export interface Cell<D extends object = {}>
    extends UseGroupByCellProps<D>,
      UseRowStateCellProps<D> {}

  export interface ColumnInstance<D extends object = {}>
    extends UseGroupByColumnProps<D>,
      UseSortByColumnProps<D>,
      UseFiltersColumnProps<D> {}
}
