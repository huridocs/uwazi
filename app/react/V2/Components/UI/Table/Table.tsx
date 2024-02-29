import React, { useEffect, useMemo, useState } from 'react';
import {
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { useIsFirstRender } from 'app/V2/CustomHooks/useIsFirstRender';
import { TableProps, CheckBoxHeader, CheckBoxCell } from './TableElements';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { Translate } from 'app/I18N';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const applyForSelection = (
  withSelection: any,
  withOutSelection: any,
  enableSelection: boolean = false
) => (enableSelection ? withSelection : withOutSelection);

// eslint-disable-next-line comma-spacing, max-statements
const Table = <T,>({
  columns,
  data,
  title,
  footer,
  initialState,
  enableSelection,
  sorting,
  setSorting,
  onSelection,
  subRowsKey,
  blankLabel,
  draggableRows = false,
  onChange = () => {},
}: TableProps<T>) => {
  const manualSorting = Boolean(setSorting);
  const [internalSorting, setInternalSortingSorting] = useState<SortingState>(
    initialState?.sorting || []
  );
  const [rowSelection, setRowSelection] = useState({});
  const [internalData, setInternalData] = useState(data);
  const [sortedChanged, setSortedChanged] = useState(false);
  const isFirstRender = useIsFirstRender();

  useEffect(() => {
    setRowSelection({});
    setInternalData(data);
  }, [data]);

  const memoizedColumns = useMemo(
    () => [
      ...applyForSelection(
        [
          {
            ...{
              id: 'checkbox-select',
              header: CheckBoxHeader,
              cell: CheckBoxCell,
            },
            meta: { headerClassName: 'w-0' },
          },
        ],
        [],
        enableSelection
      ),
      ...columns,
    ],
    [columns, enableSelection]
  );

  const sortingState = manualSorting ? sorting : internalSorting;
  const sortingFunction = manualSorting ? setSorting : setInternalSortingSorting;

  const table = useReactTable({
    columns: memoizedColumns,
    manualSorting,
    data: internalData,
    initialState,
    state: {
      sorting: sortingState,
      ...applyForSelection({ rowSelection }, {}, enableSelection),
    },
    enableRowSelection: enableSelection,
    enableSubRowSelection: false,
    onRowSelectionChange: applyForSelection(setRowSelection, () => undefined, enableSelection),
    onSortingChange: sortingFunction,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row: any) => {
      if (subRowsKey) {
        return row[subRowsKey];
      }
      return [];
    },
  });

  useEffect(() => {
    if (isFirstRender) {
      return;
    }

    const sorted = table.getRowModel().rows.map(row => row.original);
    onChange(sorted);
    setSortedChanged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingState]);

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().flatRows;
    if (onSelection) {
      onSelection(selectedRows);
    }
  }, [onSelection, rowSelection, table]);

  const handleOnChange = (changedItems: T[]) => {
    setSortedChanged(true);
    onChange(changedItems);
  };

  const getBlankLabel = () => (
    <div className="h-2 text-lg font-bold text-gray-500">
      <div>{blankLabel || <Translate>No items</Translate>}</div>
      <div className="">
        <InformationCircleIcon className="w-5 p-1 font-bold bg-gray-200 rounded-full" />
      </div>
    </div>
  );

  const blankCssClasses = internalData.length < 1 ? 'h-full' : '';

  return (
    <div className={`relative h-full overflow-x-auto border rounded-md shadow-sm border-gray-50`}>
      <table className={`w-full ${blankCssClasses} text-sm text-left`} data-testid="table">
        {title && (
          <caption className="p-4 text-base font-semibold text-left text-gray-900 bg-white">
            {title}
          </caption>
        )}

        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <TableHeader
              key={headerGroup.id}
              headerGroup={headerGroup}
              draggableRows={draggableRows}
              sortedChanged={sortedChanged}
            />
          ))}
        </thead>
        {internalData.length ? (
          <TableBody
            draggableRows={draggableRows}
            items={data}
            table={table}
            subRowsKey={subRowsKey}
            onChange={handleOnChange}
          />
        ) : (
          <tbody>
            <tr className="border-dashed">
              <td align="center" colSpan={columns.length + 1}>
                {getBlankLabel()}
              </td>
            </tr>
          </tbody>
        )}
      </table>
      {footer && <div className="p-4">{footer}</div>}
    </div>
  );
};

export { Table };
