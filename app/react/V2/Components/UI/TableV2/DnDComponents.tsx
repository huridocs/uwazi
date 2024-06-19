/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-props-no-spreading */
import React, { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';
import { t, Translate } from 'app/I18N';
import { RowWithId } from './Table';

const RowDragHandleCell = <T extends RowWithId<T>>({ row }: { row: Row<T> }) => {
  const { attributes, listeners, isDragging } = useSortable({
    id: row.id,
  });

  const canExpand = row.getCanExpand();
  const expanded = row.getIsExpanded();
  const parentRow = row.getParentRow();

  if (canExpand && expanded && isDragging) {
    row.toggleExpanded();
  }

  return (
    <button {...attributes} {...listeners} type="button">
      🟰
      <span className="sr-only">{`${t('System', 'Drag row', null, false)} ${parentRow ? `${parentRow.index + 1}-${row.index + 1}` : `${row.index + 1}`}`}</span>
    </button>
  );
};

const DraggableRow = <T extends RowWithId<T>>({ row }: { row: Row<T> }) => {
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

const DnDHeader = () => <Translate className="sr-only">Empty</Translate>;

export { RowDragHandleCell, DraggableRow, DnDHeader };
