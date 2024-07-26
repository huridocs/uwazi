/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-props-no-spreading */
import React, { CSSProperties, useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { TableRow } from './Table';

const dndHoverClass = 'shadow-[inset_0_-4px_#3949AB]';
const childIndicatorClass = 'shadow-[inset_5px_0px_0px_-1px_#3949AB]';

const inactiveGradientStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%,-50%)',
  width: '16px',
  height: '80%',
  background: 'radial-gradient(circle, #c5cae9 25%, transparent 26%) 0% 0% / 8px 10px',
};

const activeGradientStyle: CSSProperties = {
  ...inactiveGradientStyle,
  background: 'radial-gradient(circle, #303f9f 25%, transparent 26%) 0% 0% / 8px 10px',
};

const getSytles = (expanded: boolean, isOver: boolean) => {
  const expandedGroupStyles = expanded
    ? 'bg-indigo-100 border-indigo-100 hover:bg-indigo-200 hover:border-indigo-200'
    : '';
  const dndHoverStyles = isOver ? dndHoverClass : '';
  return `${expandedGroupStyles} ${dndHoverStyles}`;
};

const RowDragHandleCell = <T extends TableRow<T>>({ row }: { row: Row<T> }) => {
  const { attributes, listeners, isDragging } = useSortable({
    id: row.id,
  });
  const [handlerStyle, setHandlerStyle] = useState(inactiveGradientStyle);

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
      onMouseEnter={() => {
        setHandlerStyle(activeGradientStyle);
      }}
      onMouseLeave={() => {
        setHandlerStyle(inactiveGradientStyle);
      }}
      type="button"
      style={isDragging ? activeGradientStyle : handlerStyle}
    >
      <span className="sr-only">
        <Translate>Drag row</Translate>
      </span>
    </button>
  );
};

const DraggableRow = <T extends TableRow<T>>({
  row,
  colSpan,
  groupColumnIndex,
  dndEnabled,
}: {
  row: Row<T>;
  colSpan: number;
  groupColumnIndex: number;
  dndEnabled: boolean;
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
            className={`relative px-4 py-2 ${cell.column.columnDef.meta?.contentClassName} ${isChild && groupColumnIndex === index ? childIndicatorClass : ''}`}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>

      {isEmpty && expanded && (
        <tr
          ref={dropNoderef}
          className={`border-b text-gray-900 transition-colors ${isOverDropzone ? dndHoverClass : ''}`}
        >
          <td className="px-4 py-3 text-sm italic text-gray-600" colSpan={colSpan}>
            {dndEnabled ? (
              <Translate>Empty group. Drop here to add</Translate>
            ) : (
              <Translate>This group is empty</Translate>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

const DnDHeader = () => <Translate className="sr-only">Empty</Translate>;

export { RowDragHandleCell, DraggableRow, DnDHeader };
