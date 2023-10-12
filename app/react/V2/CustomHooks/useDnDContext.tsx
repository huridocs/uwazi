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
  sortActiveitems,
} from './dragAndDrop/definitions';

const useDnDContext = (
  type: ItemTypes,
  initialItems: IDraggable[] = [],
  sourceItems: IDraggable[] = []
) => {
  const [activeItems, setActiveItems] = useState<IDraggable[]>(mapWithParent(initialItems));
  const [availableItems, setAvailableItems] = useState<IDraggable[]>(mapWithID(sourceItems || []));

  const updateItems = (index: number, values: IDraggable) => {
    setActiveItems((prevActiveItems: IDraggable[]) =>
      update(prevActiveItems, {
        [index]: {
          name: { $set: values.name },
        },
      })
    );
  };

  const dndContext: IDnDContext = {
    type,
    addItem: addActiveItem(activeItems, setActiveItems, availableItems, setAvailableItems),
    removeItem: removeActiveItem(activeItems, setActiveItems, setAvailableItems),
    sort: sortActiveitems(activeItems, setActiveItems),
    updateItems,
    updateActiveItems: (items: IDraggable[]) => {
      setActiveItems(items);
    },
    activeItems,
    availableItems,
  };
  return dndContext;
};

export { useDnDContext };
