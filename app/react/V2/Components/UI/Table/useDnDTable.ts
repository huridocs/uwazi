import { useEffect } from 'react';
import { Table, Row, SortingState } from '@tanstack/react-table';
import { ItemTypes } from 'app/V2/shared/types';
import type { IDraggable } from 'app/V2/shared/types';
import { useDnDContext } from '../../Layouts/DragAndDrop';

const useDnDTable = <T>(
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

  return { activeItems: draggableRows ? dndContext.activeItems : [], dndContext };
};

export { useDnDTable };
