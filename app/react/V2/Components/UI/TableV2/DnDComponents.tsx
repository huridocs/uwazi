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

  const canExpand = row.originalSubRows;
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
  const isParent = row.getCanExpand() || row.originalSubRows;
  const isChild = row.parentId;
  const expanded = row.getIsExpanded();
  const isEmpty = row.originalSubRows?.length === 0;

  const { transform, setNodeRef, isDragging, isOver } = useSortable({
    id: row.id,
  });

  const { setNodeRef: dropNoderef, isOver: isOverDropzone } = useSortable({
    id: `${row.id}-dropzone`,
  });

  const style: CSSProperties = {
    ...(isDragging && {
      transform: CSS.Transform.toString({
        x: transform?.x || 1,
        y: transform?.y || 1,
        scaleX: 1,
        scaleY: 1,
      }),
    }),
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  const getClassName = () => {
    if (isOver) {
      return 'bg-red-500 text-white';
    }

    if (isParent || isChild) {
      return 'bg-success-300';
    }

    return 'bg-primary-300';
  };

  return (
    <>
      <tr ref={setNodeRef} style={style} className={getClassName()}>
        {row.getVisibleCells().map(cell => (
          <td key={cell.id} style={{ width: cell.column.getSize() }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {isParent && isEmpty && expanded && (
        <tr
          ref={dropNoderef}
          style={style}
          className={isOverDropzone ? 'text-white bg-red-500' : ''}
        >
          <td>dropzone</td>
        </tr>
      )}
    </>
  );
};

const DnDHeader = () => <Translate className="sr-only">Empty</Translate>;

export { RowDragHandleCell, DraggableRow, DnDHeader };
