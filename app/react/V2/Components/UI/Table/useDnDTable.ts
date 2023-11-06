import { useEffect, useState } from 'react';
import { Table, Row, SortingState } from '@tanstack/react-table';
import { ItemTypes } from 'app/V2/shared/types';
import type { IDraggable } from 'app/V2/shared/types';
import { useDnDContext } from '../../Layouts/DragAndDrop';

const useDnDTable = <T>(
  draggableRows: boolean,
  getDisplayName: (item: IDraggable<Row<T>>) => string,
  table: Table<T>,
  sortingState?: SortingState,
  onChange: (rows: Row<T>[]) => void = () => {}
) => {
  const [reset, setReset] = useState(false);
  const dndContext = useDnDContext<Row<T>>(
    ItemTypes.ROW,
    {
      getDisplayName,
      sortCallback: () => {
        setReset(true);
        table.resetSorting(true);
      },
      onChange,
    },
    table.getRowModel().rows,
    []
  );

  useEffect(() => {
    if (!draggableRows) {
      return;
    }
    if (!reset) {
      dndContext.updateActiveItems(table.getRowModel().rows);
    } else {
      setReset(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingState]);

  return { activeItems: draggableRows ? dndContext.activeItems : [], dndContext, setReset };
};

export { useDnDTable };
