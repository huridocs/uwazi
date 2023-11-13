import { useEffect, useState } from 'react';
import update from 'immutability-helper';
import type { IDraggable } from 'app/V2/shared/types';
import { ItemTypes } from 'app/V2/shared/types';
import type { IDnDContext, IDnDOperations } from './DnDDefinitions';
import {
  addActiveItem,
  removeActiveItem,
  mapWithID,
  mapWithParent,
  sortActiveItems,
} from './DnDDefinitions';

/* eslint-disable comma-spacing */
const useDnDContext = <T,>(
  type: ItemTypes,
  operations: IDnDOperations<T>,
  initialItems: T[] = [],
  sourceItems: IDraggable<T>[] = []
) => {
  const [activeItems, setActiveItems] = useState<IDraggable<T>[]>(
    mapWithParent(initialItems, undefined, operations.itemsProperty)
  );
  const [internalChange, setInternalChange] = useState(false);
  const [availableItems, setAvailableItems] = useState<IDraggable<T>[]>(
    mapWithID(sourceItems || [])
  );
  const itemsProperty = operations.itemsProperty || 'items';

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

  const state = {
    activeItems,
    setActiveItems,
    availableItems,
    setAvailableItems,
    itemsProperty,
    operations,
  };
  const dndContext: IDnDContext<T> = {
    type,
    addItem: addActiveItem(state),
    removeItem: removeActiveItem(state),
    sort: sortActiveItems(state),
    updateItem,
    updateActiveItems: (items: T[]) => {
      const updatedItems = mapWithParent(items, undefined, itemsProperty);
      setActiveItems(updatedItems);
      setInternalChange(false);
      return updatedItems;
    },
    activeItems,
    availableItems,
    getDisplayName: operations.getDisplayName,
    itemsProperty,
  };
  return dndContext;
};

export { useDnDContext };
