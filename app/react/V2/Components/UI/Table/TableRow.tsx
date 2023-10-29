/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren, useRef } from 'react';
import { Row, flexRender } from '@tanstack/react-table';
import type { IDraggable } from 'app/V2/shared/types';
import { DraggableItem, type IDnDContext } from '../../Layouts/DragAndDrop';
import { GrabDoubleIcon } from '../../CustomIcons';

interface TableRowProps<T> extends PropsWithChildren {
  draggableRow: boolean;
  item: Row<T> | IDraggable<Row<T>>;
  index: number;
  dndContext: IDnDContext<Row<T>>;
  enableSelection: boolean | undefined;
}

/* eslint-disable comma-spacing */
const isRow = <T,>(row: Row<T> | IDraggable<Row<T>>): row is Row<T> =>
  (row as IDraggable<Row<T>>).value === undefined;

/* eslint-disable comma-spacing */
const TableRow = <T,>({
  draggableRow,
  item,
  index,
  dndContext,
  enableSelection,
}: TableRowProps<T>) => {
  const rowValue = (isRow(item) ? item : (item as IDraggable<Row<T>>).value) as Row<T>;
  const previewRef = useRef<HTMLTableRowElement>(null);
  const icons = draggableRow
    ? [
        <DraggableItem
          key={`grab_${item.id}`}
          item={item as IDraggable<Row<T>>}
          index={index}
          context={dndContext}
          wrapperType="div"
          className="bg-white border-0"
          container="root"
          iconHandle
          previewRef={previewRef}
        >
          <GrabDoubleIcon className="w-2" />
        </DraggableItem>,
      ]
    : [];
  const isSubGroup = rowValue.depth > 0;
  let bg = rowValue.getCanExpand() || isSubGroup ? 'bg-primary-50' : 'bg-white';
  bg = rowValue.getCanExpand() && rowValue.getIsExpanded() ? 'bg-primary-100' : bg;
  return (
    <tr key={item.id} className={`${bg} border-b`} ref={previewRef}>
      {rowValue.getVisibleCells().map((cell, columnIndex) => {
        const isSelect = cell.column.id === 'checkbox-select';
        const firstColumnClass =
          cell.column.id === 'checkbox-select' || (draggableRow && columnIndex === 0)
            ? 'flex items-center gap-3'
            : '';

        let border = '';
        if (
          (isSubGroup && enableSelection && columnIndex === 1) ||
          (isSubGroup && !enableSelection && columnIndex === 0)
        ) {
          border = 'border-l-2 border-primary-300';
        }

        return (
          <td
            key={cell.id}
            className={`${firstColumnClass} ${isSelect ? 'px-2' : 'px-6'} ${border} py-2`}
          >
            {icons[columnIndex]}
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
};

export { TableRow };
