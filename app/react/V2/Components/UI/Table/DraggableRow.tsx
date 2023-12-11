/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren, RefObject } from 'react';
import { Row } from '@tanstack/react-table';
import { IDraggable } from 'app/V2/shared/types';
import { DraggableItem, DropZone, type IDnDContext } from '../../Layouts/DragAndDrop';
import { GrabDoubleIcon } from '../../CustomIcons';

interface GrabIconProps<T> extends PropsWithChildren {
  row: Row<T>;
  dndContext: IDnDContext<T>;
  previewRef?: RefObject<HTMLElement>;
  item: IDraggable<T>;
}

interface RowWrapperProps<T> extends PropsWithChildren {
  row: Row<T>;
  className?: string;
  draggableRow?: boolean;
  dndContext?: IDnDContext<T>;
  innerRef?: RefObject<HTMLElement>;
}

// eslint-disable-next-line comma-spacing
const GrabIcon = <T,>({ dndContext, row, previewRef, item }: GrabIconProps<T>) => {
  const grabIconColor =
    row.getCanExpand() || row.depth > 0 ? 'rgb(199 210 254)' : 'rgb(224 231 255)';
  return (
    <DraggableItem
      key={`grab_${item.dndId}`}
      item={item}
      index={row.index}
      context={dndContext}
      wrapperType="div"
      className="border-0"
      container={row.parentId ? `group_${row.parentId}` : 'root'}
      iconHandle
      previewRef={previewRef}
    >
      <GrabDoubleIcon className="w-2" color={`${grabIconColor}`} />
    </DraggableItem>
  );
};

const RowWrapper =
  // eslint-disable-next-line comma-spacing
  <T,>({ children, dndContext, row, draggableRow, className, innerRef }: RowWrapperProps<T>) => {
    if (!draggableRow || !dndContext) {
      return <tr key={`row_${row.id}`}>{children}</tr>;
    }
    if (!row.parentId && row.getLeafRows().length === 0) {
      return (
        <tr key={`row_${row.id}`} ref={innerRef! as RefObject<HTMLTableRowElement>}>
          {children}
        </tr>
      );
    }
    const parentItem = dndContext.activeItems.find(item => item.dndId === row.parentId);
    return (
      <DropZone
        type={dndContext.type}
        className={className}
        activeClassName="border-t-4 border-primary-300"
        context={dndContext}
        name={`group_${row.id}`}
        key={`group_${row.id}`}
        wrapperType="tr"
        parent={row.parentId ? parentItem : undefined}
        innerRef={innerRef}
      >
        {children}
      </DropZone>
    );
  };

export { RowWrapper, GrabIcon };
