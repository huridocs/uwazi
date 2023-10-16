import { Dispatch } from 'react';
import update from 'immutability-helper';
import { omit } from 'lodash';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import ID from 'shared/uniqueID';

interface IDnDContext<T> {
  type: ItemTypes;
  addItem: (item: IDraggable<T>) => void;
  removeItem: (item: IDraggable<T>) => void;
  updateItem: (values: IDraggable<T>) => void;
  updateActiveItems: (items: IDraggable<T>[]) => void;
  sort: Function;
  activeItems: IDraggable<T>[];
  availableItems: IDraggable<T>[];
  getDisplayName: (item: IDraggable<T>) => string;
}

const setIdAndParent = <T>(item: IDraggable<T>, parent?: IDraggable<T>) => {
  const id = item.id || ID();
  return { ...item, id, ...(parent ? { parent } : {}) };
};

function mapWithParent<T>(items: T[], parent?: IDraggable<T>): IDraggable<T>[] {
  return items.map(item => {
    const draggableItem = { value: item } as IDraggable<T>;
    const itemWithId: IDraggable<T> = setIdAndParent(draggableItem, parent);
    if (draggableItem.value.items && draggableItem.value.items.length > 0) {
      return {
        ...itemWithId,
        value: {
          ...itemWithId.value,
          items: mapWithParent<T>(draggableItem.value.items as T[], itemWithId),
        },
      };
    }
    return itemWithId;
  }) as IDraggable<T>[];
}

const mapWithID = <T>(items: IDraggable<T>[]) => items.map(item => setIdAndParent(item));

const removeChildFromParent = <T>(
  activeItems: IDraggable<T>[],
  setActiveItems: Dispatch<React.SetStateAction<IDraggable<T>[]>>,
  newItem: IDraggable<T>
) => {
  if (newItem.parent) {
    const indexOfCurrentParent = activeItems.findIndex(ai => ai.id === newItem.parent!.id);

    setActiveItems((prevActiveItems: IDraggable<T>[]) => {
      const index = prevActiveItems[indexOfCurrentParent].value.items!.findIndex(
        ai => ai.id === newItem.id
      );
      return update(prevActiveItems, {
        [indexOfCurrentParent]: { value: { items: { $splice: [[index, 1]] } } },
      });
    });
  }
};

const findItemIndex = <T>(items: IDraggable<T>[], searchedItem: IDraggable<T>) =>
  items.findIndex(item => item.id === searchedItem.id);

const removeItemFromList = <T>(
  setActiveItems: Dispatch<React.SetStateAction<IDraggable<T>[]>>,
  indexOfNewItem: number
) => {
  if (indexOfNewItem > -1) {
    setActiveItems((prevActiveItems: IDraggable<T>[]) =>
      update(prevActiveItems, {
        $splice: [[indexOfNewItem, 1]],
      })
    );
  }
};

const addItemToParent = <T>(
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>,
  indexOfNewItem: number,
  newItem: IDraggable<T>,
  parent: IDraggable<T>
) => {
  removeItemFromList(setActiveItems, indexOfNewItem);

  setActiveItems((prevActiveItems: IDraggable<T>[]) => {
    const indexOfParent = findItemIndex(prevActiveItems, parent);
    if (indexOfParent > -1) {
      return prevActiveItems[indexOfParent].value.items
        ? update(prevActiveItems, {
            [indexOfParent]: {
              value: {
                items: {
                  $push: [{ ...omit(newItem, ['parent', 'container', 'items']), parent }],
                },
              },
            },
          })
        : update(prevActiveItems, {
            [indexOfParent]: {
              value: {
                items: {
                  $set: [{ ...newItem, parent }],
                },
              },
            },
          });
    }
    return prevActiveItems;
  });
};

const addActiveItem =
  <T>(
    activeItems: IDraggable<T>[],
    setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>,
    availableItems: IDraggable<T>[],
    setAvailableItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>
  ) =>
  (newItem: IDraggable<T>, parent?: IDraggable<T>) => {
    removeChildFromParent(activeItems, setActiveItems, newItem);

    const indexOfNewItem = findItemIndex(activeItems, newItem);

    if (parent) {
      addItemToParent(setActiveItems, indexOfNewItem, newItem, parent);
    } else if (indexOfNewItem === -1) {
      setActiveItems((prevActiveItems: IDraggable<T>[]) =>
        update(prevActiveItems, {
          $push: [omit(newItem, ['parent', 'container', 'items'])],
        })
      );
    }
    const indexOfSource = findItemIndex(availableItems, newItem);
    removeItemFromList(setAvailableItems, indexOfSource);
  };

const removeActiveItem =
  <T>(
    activeItems: IDraggable<T>[],
    setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>,
    setAvailableItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>
  ) =>
  (item: IDraggable<T>) => {
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

const sortChildren = <T>(
  activeItems: IDraggable<T>[],
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>,
  {
    currentItem,
    target,
    dragIndex,
    hoverIndex,
  }: { currentItem: IDraggable<T>; target: IDraggable<T>; dragIndex: number; hoverIndex: number }
) => {
  const indexOfParent = findItemIndex(activeItems, currentItem.parent!);
  const targetIndex = findItemIndex(activeItems[indexOfParent].valueitems || [], target);

  if (targetIndex === hoverIndex) {
    setActiveItems((prevActiveItems: IDraggable<T>[]) =>
      update(prevActiveItems, {
        [indexOfParent]: {
          value: {
            items: {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, prevActiveItems[indexOfParent].items![dragIndex]],
              ],
            },
          },
        },
      })
    );
  }
};

const sortParents = <T>(
  activeItems: IDraggable<T>[],
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>,
  {
    target,
    dragIndex,
    hoverIndex,
  }: { currentItem: IDraggable<T>; target: IDraggable<T>; dragIndex: number; hoverIndex: number }
) => {
  const targetIndex = findItemIndex(activeItems, target);
  if (targetIndex === hoverIndex) {
    setActiveItems((prevActiveItems: IDraggable<T>[]) =>
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
  <T>(
    activeItems: IDraggable<T>[],
    setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>
  ) =>
  (currentItem: IDraggable<T>, target: IDraggable<T>, dragIndex: number, hoverIndex: number) => {
    if (currentItem.parent !== undefined) {
      sortChildren(activeItems, setActiveItems, { currentItem, target, dragIndex, hoverIndex });
    } else {
      sortParents(activeItems, setActiveItems, { currentItem, target, dragIndex, hoverIndex });
    }
  };

export type { IDnDContext };
export { addActiveItem, removeActiveItem, sortActiveItems, mapWithParent, mapWithID };
