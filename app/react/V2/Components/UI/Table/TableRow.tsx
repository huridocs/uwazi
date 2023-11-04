/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren, useRef } from 'react';
import { Row, flexRender } from '@tanstack/react-table';
import { DraggableItem, type IDnDContext } from '../../Layouts/DragAndDrop';
import { GrabDoubleIcon } from '../../CustomIcons';

interface TableRowProps<T> extends PropsWithChildren {
  draggableRow: boolean;
  row: Row<T>;
  index: number;
  dndContext: IDnDContext<T>;
  enableSelection: boolean | undefined;
}

/* eslint-disable comma-spacing */
const TableRow = <T,>({ draggableRow, row, dndContext, enableSelection }: TableRowProps<T>) => {
  const previewRef = useRef<HTMLTableRowElement>(null);
  const di = row.parentId
    ? dndContext.activeItems[row.getParentRow()!.index].value.items![row.index]
    : dndContext.activeItems[row.index];
  const icons = draggableRow
    ? [
        <DraggableItem
          key={`grab_${row.id}`}
          item={di}
          index={row.index}
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
  const isSubGroup = row.depth > 0;
  let bg = row.getCanExpand() || isSubGroup ? 'bg-primary-50' : 'bg-white';
  bg = row.getCanExpand() && row.getIsExpanded() ? 'bg-primary-100' : bg;
  return (
    <tr key={row.id} className={`${bg} border-b`} ref={previewRef}>
      {row.getVisibleCells().map((cell, columnIndex) => {
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
