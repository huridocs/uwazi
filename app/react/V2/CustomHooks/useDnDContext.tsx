/* eslint-disable max-statements */
import { useState } from 'react';
import update from 'immutability-helper';
import { IDraggable, ItemTypes } from '../shared/types';
import {
  IDnDContext,
  addActiveItem,
  removeActiveItem,
  mapWithID,
  mapWithParent,
  sortActiveItems,
} from './dragAndDrop/definitions';

// eslint-disable-next-line prettier/prettier
const useDnDContext = <T, >(
  type: ItemTypes,
  getDisplayName: (item: IDraggable<T>) => string,
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
    sort: sortActiveItems(activeItems, setActiveItems),
    updateItem,
    updateActiveItems: (items: IDraggable<T>[]) => {
      setActiveItems(items);
    },
    activeItems,
    availableItems,
    getDisplayName,
  };
  return dndContext;
};

export { useDnDContext };
