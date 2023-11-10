import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Table } from '@tanstack/react-table';
import { ItemTypes } from 'app/V2/shared/types';
import { useDnDContext } from '../../Layouts/DragAndDrop';
import type { IDnDOperations } from '../../Layouts/DragAndDrop/DnDDefinitions';

const useDnDTable = <T>(
  draggableRows: boolean,
  table: Table<T>,
  operations: IDnDOperations<T>,
  [internalData, setInternalData]: [T[], Dispatch<SetStateAction<T[]>>]
) => {
  const [dndContextUpdated, setDndContextUpdated] = useState(false);
  const firstRender = useRef(true);

  const dndContext = useDnDContext<T>(
    ItemTypes.ROW,
    {
      ...operations,
      sortCallback: () => {
        table.resetSorting(true);
      },
    },
    internalData,
    []
  );

  useEffect(() => {
    if (draggableRows && !firstRender.current) {
      dndContext.updateActiveItems(internalData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggableRows, internalData]);

  useEffect(() => {
    if (draggableRows && !dndContextUpdated && !firstRender.current) {
      const updatedData = table.getRowModel().rows.map(r => r.original);
      dndContext.updateActiveItems(updatedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggableRows, table.getSortedRowModel()]);

  useEffect(() => {
    if (draggableRows && !dndContextUpdated && !firstRender.current) {
      setInternalData(
        dndContext.activeItems.map(x => {
          const values = x.value.items ? x.value.items.map(s => s.value) : [];
          return {
            ...x.value,
            ...(operations.itemsProperty ? { [operations.itemsProperty]: values } : {}),
          };
        })
      );
      setDndContextUpdated(true);
    } else {
      setDndContextUpdated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dndContext.activeItems, draggableRows, operations.itemsProperty, setInternalData]);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return { dndContext };
};

export { useDnDTable };
