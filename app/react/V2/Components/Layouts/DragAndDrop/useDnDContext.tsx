/* eslint-disable max-statements */
import { useState } from 'react';
import update from 'immutability-helper';
import type { IDraggable } from 'app/V2/shared/types';
import { ItemTypes } from 'app/V2/shared/types';
import {
  type IDnDContext,
  addActiveItem,
  removeActiveItem,
  mapWithID,
  mapWithParent,
  sortActiveItems,
} from './DnDDefinitions';

// eslint-disable-next-line prettier/prettier
const useDnDContext = <T, >(
  type: ItemTypes,
  operations: { getDisplayName: (item: IDraggable<T>) => string; sortCallback?: Function },
  initialItems: T[] = [],
  sourceItems: IDraggable<T>[] = []
) => {
  const [activeItems, setActiveItems] = useState<IDraggable<T>[]>(mapWithParent(initialItems));
  const [availableItems, setAvailableItems] = useState<IDraggable<T>[]>(
    mapWithID(sourceItems || [])
  );

  const updateItem = (item: IDraggable<T>) => {
    setActiveItems((prevActiveItems: IDraggable<T>[]) => {
      const index = prevActiveItems.findIndex(x => x.id === item.id);
      return update(prevActiveItems, {
        [index]: {
          $set: item,
        },
      });
    });
  };

  const dndContext: IDnDContext<T> = {
    type,
    addItem: addActiveItem(activeItems, setActiveItems, availableItems, setAvailableItems),
    removeItem: removeActiveItem(activeItems, setActiveItems, setAvailableItems),
    sort: sortActiveItems(activeItems, setActiveItems, operations.sortCallback),
    updateItem,
    updateActiveItems: (items: T[]) => {
      setActiveItems(mapWithParent(items));
    },
    activeItems,
    availableItems,
    getDisplayName: operations.getDisplayName,
  };
  return dndContext;
};

export { useDnDContext };
