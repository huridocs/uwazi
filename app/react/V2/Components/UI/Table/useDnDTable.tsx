import React, { PropsWithChildren, useEffect } from 'react';
import { Table, Row, SortingState } from '@tanstack/react-table';
import { ItemTypes } from 'app/V2/shared/types';
import type { IDraggable } from 'app/V2/shared/types';
import { DraggableItem, useDnDContext } from '../../Layouts/DragAndDrop';

interface TableRowProps<T> extends PropsWithChildren {
  item: IDraggable<T>;
  index: number;
}
// eslint-disable-next-line prettier/prettier
const useDnDTable = <T, >(
  draggableRows: boolean,
  getDisplayName: (item: IDraggable<Row<T>>) => string,
  table: Table<T>,
  sortingState?: SortingState
) => {
  const dndContext = useDnDContext<Row<T>>(
    ItemTypes.ROW,
    getDisplayName,
    table.getRowModel().rows,
    []
  );

  useEffect(() => {
    if (draggableRows) {
      dndContext.updateActiveItems(table.getRowModel().rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingState]);
  // eslint-disable-next-line prettier/prettier
  const DnDRow = ({ item, index, children }: TableRowProps<T>) => (
    <DraggableItem
      key={item.id}
      item={item}
      index={index}
      context={dndContext}
      wrapperType="tr"
      className="bg-white border-b"
      container="root"
    >
      {/* <tr key={item.id} className="bg-white border-b"> */}
      {children}
      {/* </tr> */}
    </DraggableItem>
  );

  return { DnDRow, activeItems: draggableRows ? dndContext.activeItems : [], dndContext };
};

export { useDnDTable };
