/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren } from 'react';
import { Row, flexRender } from '@tanstack/react-table';
import type { IDraggable } from 'app/V2/shared/types';
import { DraggableItem, type IDnDContext } from '../../Layouts/DragAndDrop';

interface TableRowProps<T> extends PropsWithChildren {
  draggableRow: boolean;
  item: Row<T> | IDraggable<Row<T>>;
  index: number;
  dndContext: IDnDContext<Row<T>>;
}

// eslint-disable-next-line prettier/prettier
const BaseRow = <T, >({ draggableRow, item, index, dndContext, children }: TableRowProps<T>) =>
  draggableRow ? (
    <DraggableItem
      key={item.id}
      item={item as IDraggable<Row<T>>}
      index={index}
      context={dndContext}
      wrapperType="tr"
      className="bg-white border-b"
      container="root"
    >
      {children}
    </DraggableItem>
  ) : (
    <tr key={item.id} className="bg-white border-b">
      {children}
    </tr>
  );

// eslint-disable-next-line prettier/prettier
const isRow = <T, >(row: Row<T> | IDraggable<Row<T>>): row is Row<T> =>
  (row as IDraggable<Row<T>>).value === undefined;

// eslint-disable-next-line prettier/prettier
const TableRow = <T, >({ draggableRow, item, index, dndContext }: TableRowProps<T>) => {
  const rowValue = (isRow(item) ? item : (item as IDraggable<Row<T>>).value) as Row<T>;
  return (
    <BaseRow draggableRow={draggableRow} item={item} index={index} dndContext={dndContext}>
      {rowValue.getVisibleCells().map(cell => {
        const isSelect = cell.column.id === 'checkbox-select';
        return (
          <td
            key={cell.id}
            className={`${isSelect ? 'px-2' : 'px-6'} py-3 ${
              cell.column.columnDef.meta?.contentClassName || ''
            }`}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </BaseRow>
  );
};

export { TableRow };
