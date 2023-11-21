/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren, RefObject } from 'react';
import { Row } from '@tanstack/react-table';
import { DraggableItem, DropZone, type IDnDContext } from '../../Layouts/DragAndDrop';
import { GrabDoubleIcon } from '../../CustomIcons';

interface GrabIconProps<T> extends PropsWithChildren {
  row: Row<T>;
  dndContext: IDnDContext<T>;
  previewRef?: RefObject<HTMLElement>;
}

interface RowWrapperProps<T> extends PropsWithChildren {
  row: Row<T>;
  className?: string;
  draggableRow?: boolean;
  dndContext?: IDnDContext<T>;
  innerRef?: RefObject<HTMLElement>;
}

// eslint-disable-next-line comma-spacing
const GrabIcon = <T,>({ dndContext, row, previewRef }: GrabIconProps<T>) => {
  const di = row.parentId
    ? dndContext.activeItems[row.getParentRow()!.index].value.items![row.index]
    : dndContext.activeItems[row.index];
  return (
    <DraggableItem
      key={`grab_${row.id}`}
      item={di}
      index={row.index}
      context={dndContext}
      wrapperType="div"
      className="border-0"
      container={row.parentId ? `group_${row.parentId}` : 'root'}
      iconHandle
      previewRef={previewRef}
    >
      <GrabDoubleIcon className="w-2" />
    </DraggableItem>
  );
};

const RowWrapper =
  // eslint-disable-next-line comma-spacing
  <T,>({ children, dndContext, row, draggableRow, className, innerRef }: RowWrapperProps<T>) => {
    if (!draggableRow || !dndContext) {
      return <tr>{children}</tr>;
    }
    return (
      <DropZone
        type={dndContext.type}
        className={className}
        activeClassName="border-t-4 border-primary-300"
        context={dndContext}
        name={`group_${row.id}`}
        key={`group_${row.id}`}
        wrapperType="tr"
        parent={row.parentId ? dndContext.activeItems[row.getParentRow()!.index] : undefined}
        innerRef={innerRef}
      >
        {children}
      </DropZone>
    );
  };

export { RowWrapper, GrabIcon };
