/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-props-no-spreading */
import React, { CSSProperties, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { RowWithId } from './Table';

const getSytles = (expanded: boolean, isOver: boolean) => {
  const expandedGroupStyles = expanded
    ? 'bg-indigo-300 border-indigo-300 hover:bg-indigo-400 hover:border-indigo-400'
    : '';
  const dndHoverStyles = isOver ? 'border-b-indigo-700' : '';

  return `${expandedGroupStyles} ${dndHoverStyles}`;
};

const RowDragHandleCell = <T extends RowWithId<T>>({ row }: { row: Row<T> }) => {
  const { attributes, listeners, isDragging } = useSortable({
    id: row.id,
  });

  const canExpand = row.originalSubRows;
  const expanded = row.getIsExpanded();

  useEffect(() => {
    if (canExpand && expanded && isDragging) {
      row.toggleExpanded();
    }
  }, [isDragging]);

  return (
    <button
      {...attributes}
      {...listeners}
      type="button"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%,-50%)',
      }}
      className={`w-4 h-4/5 transition-colors ${isDragging ? 'bg-indigo-700' : 'bg-indigo-200 hover:bg-indigo-700'}`}
    >
      <span className="sr-only">
        <Translate>Drag row</Translate>
      </span>
    </button>
  );
};

const DraggableRow = <T extends RowWithId<T>>({
  row,
  colSpan,
  firstDataColumndIndex,
}: {
  row: Row<T>;
  colSpan: number;
  firstDataColumndIndex: number;
}) => {
  const expanded = row.getIsExpanded();
  const isEmpty = row.originalSubRows?.length === 0;
  const isChild = row.depth > 0;

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

  const rowStyles = getSytles(expanded, isOver);

  return (
    <>
      <tr
        style={isDragging ? draggingStyles : undefined}
        ref={setNodeRef}
        className={`text-gray-900 border-b transition-colors hover:bg-gray-50 ${rowStyles}`}
      >
        {row.getVisibleCells().map((cell, index) => (
          <td
            key={cell.id}
            style={{ width: cell.column.getSize() }}
            className={`relative px-4 py-2 ${isChild && firstDataColumndIndex === index ? 'border-l border-l-indigo-700' : ''}`}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>

      {isEmpty && expanded && (
        <tr
          ref={dropNoderef}
          className={`border-b text-gray-900 transition-colors ${isOverDropzone ? 'border-b-indigo-700' : ''}`}
        >
          <td className="px-4 py-3 text-sm italic text-gray-600" colSpan={colSpan}>
            &#91;
            <Translate>Empty group. Drop here to add</Translate>
            &#93;
          </td>
        </tr>
      )}
    </>
  );
};

const DnDHeader = () => <Translate className="sr-only">Empty</Translate>;

export { RowDragHandleCell, DraggableRow, DnDHeader };
