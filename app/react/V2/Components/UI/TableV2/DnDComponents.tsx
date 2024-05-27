/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-props-no-spreading */
import React, { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';

const RowDragHandleCell = <T extends { rowId: string }>({ row }: { row: Row<T> }) => {
  const { attributes, listeners } = useSortable({
    id: row.id,
  });

  return (
    <button {...attributes} {...listeners} type="button">
      🟰
    </button>
  );
};

const DraggableRow = <T extends { rowId: string }>({ row }: { row: Row<T> }) => {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {row.getVisibleCells().map(cell => (
        <td key={cell.id} style={{ width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};

export { RowDragHandleCell, DraggableRow };
