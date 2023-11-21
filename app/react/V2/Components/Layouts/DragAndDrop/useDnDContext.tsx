import { useEffect, useState } from 'react';
import update from 'immutability-helper';
import type { IDraggable } from 'app/V2/shared/types';
import { ItemTypes } from 'app/V2/shared/types';
import { omit } from 'lodash';
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
      const sortedItems = activeItems
        .filter(item => item)
        .map(item => {
          const values = item.value.items
            ? item.value.items.map(subItem =>
                omit(subItem.value, ['_id', 'id', 'items', operations.itemsProperty || ''])
              )
            : [];
          return {
            ...omit(item.value, ['items', 'id', operations.itemsProperty || '']),
            ...(operations.itemsProperty && values.length > 0
              ? { [operations.itemsProperty]: values }
              : {}),
          } as T;
        });
      operations.onChange(sortedItems);
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
    operations,
  };
  return dndContext;
};

export { useDnDContext };
