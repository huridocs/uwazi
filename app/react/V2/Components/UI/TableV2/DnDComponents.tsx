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
    <button {...attributes} {...listeners} type="button" className="w-2 h-6 bg-primary-700">
      <span className="sr-only">{`${t('System', 'Drag row', null, false)} ${parentRow ? `${parentRow.index + 1}-${row.index + 1}` : `${row.index + 1}`}`}</span>
    </button>
  );
};

const DraggableRow = <T extends RowWithId<T>>({ row }: { row: Row<T> }) => {
  const isParent = row.getCanExpand() || row.originalSubRows;
  const expanded = row.getIsExpanded();
  const isEmpty = row.originalSubRows?.length === 0;

  const { transform, setNodeRef, isDragging, isOver } = useSortable({
    id: row.id,
  });

  const { setNodeRef: dropNoderef, isOver: isOverDropzone } = useSortable({
    id: `${row.id}-dropzone`,
  });

  const draggingStyles: CSSProperties = {
    transformOrigin: 'left',
    transform: CSS.Transform.toString({
      x: 0,
      y: transform?.y || 0,
      scaleX: 0.7,
      scaleY: 0.7,
    }),
    cursor: 'grabbing',
    zIndex: 1,
    position: 'relative',
    opacity: 0.9,
    outline: 'rgb(81 69 205) solid 4px',
    backgroundColor: 'white',
  };

  return (
    <>
      <tr
        style={isDragging ? draggingStyles : undefined}
        ref={setNodeRef}
        className={`border-b hover:bg-gray-50 ${expanded ? 'bg-indigo-300 border-indigo-300 hover:bg-indigo-400 hover:border-indigo-400' : ''} ${isOver ? 'border-b-indigo-700' : ''}`}
      >
        {row.getVisibleCells().map((cell, index) => {
          let calculatedPadding = '';

          if (index === 0) {
            calculatedPadding = 'pl-4';
          } else if (index === row.getVisibleCells().length - 1) {
            calculatedPadding = 'pr-4';
          }

          return (
            <td
              key={cell.id}
              style={{ width: cell.column.getSize() }}
              className={`py-2 ${calculatedPadding}`}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>

      {isParent && isEmpty && expanded && (
        <tr ref={dropNoderef} className={`border-b ${isOverDropzone ? 'border-b-indigo-700' : ''}`}>
          <td className="px-4 py-2">dropzone</td>
        </tr>
      )}
    </>
  );
};

const DnDHeader = () => <Translate className="sr-only">Empty</Translate>;

export { RowDragHandleCell, DraggableRow, DnDHeader };
