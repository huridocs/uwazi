import React, { PropsWithChildren, useRef } from 'react';
import { Row, flexRender } from '@tanstack/react-table';
import { IDraggable } from 'app/V2/shared/types';
import { type IDnDContext } from '../../Layouts/DragAndDrop';
import { GrabIcon, RowWrapper } from './DraggableRow';

interface TableRowProps<T> extends PropsWithChildren {
  row: Row<T>;
  enableSelection: boolean | undefined;
  draggableRow?: boolean;
  dndContext?: IDnDContext<T>;
  item?: IDraggable<T>;
}

/* eslint-disable comma-spacing */
const TableRow = <T,>({
  draggableRow,
  row,
  dndContext,
  enableSelection,
  item,
}: TableRowProps<T>) => {
  const previewRef = useRef<HTMLTableRowElement>(null);
  const icons =
    draggableRow && dndContext && item
      ? [<GrabIcon row={row} dndContext={dndContext} previewRef={previewRef} item={item} />]
      : [];
  const isSubGroup = row.depth > 0;
  let bg = row.getCanExpand() || isSubGroup ? 'bg-primary-50' : '';
  bg = row.getCanExpand() && row.getIsExpanded() ? 'bg-primary-100' : bg;

  return (
    <RowWrapper
      className={`${bg} border-b`}
      draggableRow={draggableRow}
      row={row}
      dndContext={dndContext}
      innerRef={previewRef}
      key={`row${row.id}`}
    >
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
            className={`${firstColumnClass} ${isSelect ? 'px-2' : 'px-6'} ${border} py-2 ${
              cell.column.columnDef.meta?.contentClassName || ''
            }`}
          >
            {icons[columnIndex]}
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </RowWrapper>
  );
};

export { TableRow };
