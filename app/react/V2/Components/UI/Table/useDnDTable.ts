import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Table } from '@tanstack/react-table';
import { ItemTypes } from 'app/V2/shared/types';
import { omit } from 'lodash';
import { useDnDContext } from '../../Layouts/DragAndDrop';
import type { IDnDOperations } from '../../Layouts/DragAndDrop/DnDDefinitions';

const useDnDTable = <T>(
  draggableRows: boolean,
  table: Table<T>,
  operations: IDnDOperations<T>,
  [internalData, setInternalData]: [T[], Dispatch<SetStateAction<T[]>>]
) => {
  enum SyncPhase {
    NONE = 0,
    FROM_TABLE = 1,
    FROM_DND = 2,
  }

  const [dndContextUpdated, setDndContextUpdated] = useState<SyncPhase>(SyncPhase.NONE);
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
    if (draggableRows && dndContextUpdated === SyncPhase.NONE && !firstRender.current) {
      const updatedData = table
        .getRowModel()
        .rows.filter(r => !r.parentId)
        .map(r => r.original);
      dndContext.updateActiveItems(updatedData);
      setDndContextUpdated(SyncPhase.FROM_TABLE);
    } else {
      setDndContextUpdated(SyncPhase.NONE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggableRows, table.getSortedRowModel()]);

  useEffect(() => {
    if (draggableRows && dndContextUpdated === SyncPhase.NONE && !firstRender.current) {
      const sortedItems = dndContext.activeItems.map(item => {
        const values = item.value.items
          ? item.value.items.map(subItem =>
              omit(subItem.value, ['_id', 'items', operations.itemsProperty || ''])
            )
          : [];
        return {
          ...omit(item.value, ['items', operations.itemsProperty || '']),
          ...(operations.itemsProperty && values.length > 0
            ? { [operations.itemsProperty]: values }
            : {}),
        } as T;
      });

      setInternalData(sortedItems);
      if (operations.onChange) {
        operations.onChange(sortedItems);
      }
      setDndContextUpdated(SyncPhase.FROM_DND);
    } else {
      setDndContextUpdated(SyncPhase.NONE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dndContext.activeItems, operations.itemsProperty, setInternalData]);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return { dndContext };
};

export { useDnDTable };
