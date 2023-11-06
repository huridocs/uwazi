/* eslint-disable max-statements */
import { useEffect, useState } from 'react';
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

/* eslint-disable comma-spacing */
const useDnDContext = <T,>(
  type: ItemTypes,
  operations: {
    getDisplayName: (item: IDraggable<T>) => string;
    sortCallback?: Function;
    onChange?: (items: T[]) => void;
  },
  initialItems: T[] = [],
  sourceItems: IDraggable<T>[] = []
) => {
  const [activeItems, setActiveItems] = useState<IDraggable<T>[]>(mapWithParent(initialItems));
  const [internalChange, setInternalChange] = useState(false);
  const [availableItems, setAvailableItems] = useState<IDraggable<T>[]>(
    mapWithID(sourceItems || [])
  );

  const updateItem = (item: IDraggable<T>) => {
    setInternalChange(true);
    setActiveItems((prevActiveItems: IDraggable<T>[]) => {
      const index = prevActiveItems.findIndex(x => x.id === item.id);
      return update(prevActiveItems, {
        [index]: {
          $set: item,
        },
      });
    });
  };

  useEffect(() => {
    if (internalChange === true && operations.onChange !== undefined) {
      operations.onChange(activeItems.map(item => item.value));
    } else {
      setInternalChange(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItems]);

  const dndContext: IDnDContext<T> = {
    type,
    addItem: addActiveItem(activeItems, setActiveItems, availableItems, setAvailableItems),
    removeItem: removeActiveItem(activeItems, setActiveItems, setAvailableItems),
    sort: sortActiveItems(activeItems, setActiveItems, operations.sortCallback),
    updateItem,
    updateActiveItems: (items: T[]) => {
      const updatedItems = mapWithParent(items);
      setActiveItems(updatedItems);
      setInternalChange(false);
      return updatedItems;
    },
    activeItems,
    availableItems,
    getDisplayName: operations.getDisplayName,
  };
  return dndContext;
};

export { useDnDContext };
