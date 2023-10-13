import { Dispatch } from 'react';
import update from 'immutability-helper';
import { omit } from 'lodash';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import ID from 'shared/uniqueID';

interface IDnDContext {
  type: ItemTypes;
  addItem: (item: IDraggable) => void;
  removeItem: (item: IDraggable) => void;
  updateItems: (index: number, values: IDraggable) => void;
  updateActiveItems: (items: IDraggable[]) => void;
  sort: Function;
  activeItems: IDraggable[];
  availableItems: IDraggable[];
}
const setIdAndParent = (item: IDraggable, parent?: IDraggable) => {
  const id = item.id || ID();
  return { ...item, id, ...(parent ? { parent } : {}) };
};
const mapWithParent: (items: IDraggable[], parent?: IDraggable) => IDraggable[] = (items, parent) =>
  items.map(item => {
    const itemWithId = setIdAndParent(item, parent);
    if (item.items && item.items.length > 0) {
      return { ...itemWithId, items: mapWithParent(item.items, itemWithId) };
    }
    return itemWithId;
  });

const mapWithID = (items: IDraggable[]) => items.map(item => setIdAndParent(item));

const removeChildFromParent = (
  activeItems: IDraggable[],
  setActiveItems: Dispatch<React.SetStateAction<IDraggable[]>>,
  newItem: IDraggable
) => {
  if (newItem.parent) {
    const indexOfCurrentParent = activeItems.findIndex(ai => ai.id === newItem.parent!.id);

    setActiveItems((prevActiveItems: IDraggable[]) => {
      const index = prevActiveItems[indexOfCurrentParent].items!.findIndex(
        ai => ai.id === newItem.id
      );
      return update(prevActiveItems, {
        [indexOfCurrentParent]: {
          items: { $splice: [[index, 1]] },
        },
      });
    });
  }
};

const findItemIndex = (items: IDraggable[], searchedItem: IDraggable) =>
  items.findIndex(item => item.id === searchedItem.id);

const removeItemFromList = (
  setActiveItems: Dispatch<React.SetStateAction<IDraggable[]>>,
  indexOfNewItem: number
) => {
  if (indexOfNewItem > -1) {
    setActiveItems((prevActiveItems: IDraggable[]) =>
      update(prevActiveItems, {
        $splice: [[indexOfNewItem, 1]],
      })
    );
  }
};

const addItemToParent = (
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable[]>>,
  indexOfNewItem: number,
  newItem: IDraggable,
  parent: IDraggable
) => {
  removeItemFromList(setActiveItems, indexOfNewItem);

  setActiveItems((prevActiveItems: IDraggable[]) => {
    const indexOfParent = findItemIndex(prevActiveItems, parent);
    if (indexOfParent > -1) {
      return prevActiveItems[indexOfParent].items
        ? update(prevActiveItems, {
            [indexOfParent]: {
              items: {
                $push: [{ ...omit(newItem, ['parent', 'container', 'items']), parent }],
              },
            },
          })
        : update(prevActiveItems, {
            [indexOfParent]: {
              items: {
                $set: [{ ...newItem, parent }],
              },
            },
          });
    }
    return prevActiveItems;
  });
};

const addActiveItem =
  (
    activeItems: IDraggable[],
    setActiveItems: React.Dispatch<React.SetStateAction<IDraggable[]>>,
    availableItems: IDraggable[],
    setAvailableItems: React.Dispatch<React.SetStateAction<IDraggable[]>>
  ) =>
  (newItem: IDraggable, parent?: IDraggable) => {
    removeChildFromParent(activeItems, setActiveItems, newItem);

    const indexOfNewItem = findItemIndex(activeItems, newItem);

    if (parent) {
      addItemToParent(setActiveItems, indexOfNewItem, newItem, parent);
    } else if (indexOfNewItem === -1) {
      setActiveItems((prevActiveItems: IDraggable[]) =>
        update(prevActiveItems, {
          $push: [omit(newItem, ['parent', 'container', 'items'])],
        })
      );
    }
    const indexOfSource = findItemIndex(availableItems, newItem);
    removeItemFromList(setAvailableItems, indexOfSource);
  };

const removeActiveItem =
  (
    activeItems: IDraggable[],
    setActiveItems: React.Dispatch<React.SetStateAction<IDraggable[]>>,
    setAvailableItems: React.Dispatch<React.SetStateAction<IDraggable[]>>
  ) =>
  (item: IDraggable) => {
    if (item.parent !== undefined) {
      removeChildFromParent(activeItems, setActiveItems, item);
    } else {
      const index = findItemIndex(activeItems, item);
      removeItemFromList(setActiveItems, index);
    }

    const availableSubItems = (item.items || []).map(ai => omit(ai, ['parent', 'container']));
    setAvailableItems(prevAvailableItems =>
      update(prevAvailableItems, {
        $push: [omit(item, ['parent', 'container', 'items']), ...availableSubItems],
      })
    );
  };

const sortChildren = (
  activeItems: IDraggable[],
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable[]>>,
  {
    currentItem,
    target,
    dragIndex,
    hoverIndex,
  }: { currentItem: IDraggable; target: IDraggable; dragIndex: number; hoverIndex: number }
) => {
  const indexOfParent = findItemIndex(activeItems, currentItem.parent!);
  const targetIndex = findItemIndex(activeItems[indexOfParent].items || [], target);

  if (targetIndex === hoverIndex) {
    setActiveItems((prevActiveItems: IDraggable[]) =>
      update(prevActiveItems, {
        [indexOfParent]: {
          items: {
            $splice: [
              [dragIndex, 1],
              [hoverIndex, 0, prevActiveItems[indexOfParent].items![dragIndex]],
            ],
          },
        },
      })
    );
  }
};

const sortParents = (
  activeItems: IDraggable[],
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable[]>>,
  {
    target,
    dragIndex,
    hoverIndex,
  }: { currentItem: IDraggable; target: IDraggable; dragIndex: number; hoverIndex: number }
) => {
  const targetIndex = findItemIndex(activeItems, target);
  if (targetIndex === hoverIndex) {
    setActiveItems((prevActiveItems: IDraggable[]) =>
      update(prevActiveItems, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevActiveItems[dragIndex]],
        ],
      })
    );
  }
};
const sortActiveItems =
  (activeItems: IDraggable[], setActiveItems: React.Dispatch<React.SetStateAction<IDraggable[]>>) =>
  (currentItem: IDraggable, target: IDraggable, dragIndex: number, hoverIndex: number) => {
    if (currentItem.parent !== undefined) {
      sortChildren(activeItems, setActiveItems, { currentItem, target, dragIndex, hoverIndex });
    } else {
      sortParents(activeItems, setActiveItems, { currentItem, target, dragIndex, hoverIndex });
    }
  };

export type { IDnDContext };
export { addActiveItem, removeActiveItem, sortActiveItems, mapWithParent, mapWithID };
