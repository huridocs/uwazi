import { Dispatch } from 'react';
import { get, omit } from 'lodash';
import update from 'immutability-helper';
import { type IDraggable, ItemTypes } from 'app/V2/shared/types';
import ID from 'shared/uniqueID';

interface IDnDContext<T> {
  itemsProperty: string;
  type: ItemTypes;
  addItem: (item: IDraggable<T>) => void;
  removeItem: (item: IDraggable<T>) => void;
  updateItem: (values: IDraggable<T>) => void;
  updateActiveItems: (items: T[]) => IDraggable<T>[];
  sort: Function;
  activeItems: IDraggable<T>[];
  availableItems: IDraggable<T>[];
  getDisplayName: (item: IDraggable<T>) => string;
}

interface IDnDOperations<T> {
  getDisplayName: (item: IDraggable<T>) => string;
  sortCallback?: Function;
  onChange?: (items: T[]) => void;
  itemsProperty?: string;
}

interface IDnDContextState<T> {
  activeItems: IDraggable<T>[];
  setActiveItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>;
  availableItems: IDraggable<T>[];
  setAvailableItems: React.Dispatch<React.SetStateAction<IDraggable<T>[]>>;
  itemsProperty: string;
  operations: IDnDOperations<T>;
}

const setIdAndParent = <T>(item: IDraggable<T>, parent?: IDraggable<T>) => {
  const id = item.id || ID();
  return { ...item, id, ...(parent ? { parent } : {}) };
};

const mapWithParent = <T>(
  items: T[],
  parent?: IDraggable<T>,
  itemsProperty: string = 'items'
): IDraggable<T>[] =>
  items.map(item => {
    const draggableItem = {
      value: item,
      ...(parent === undefined ? { container: 'root' } : {}),
    } as IDraggable<T>;
    const subItems = get(draggableItem.value, itemsProperty);
    const itemWithId: IDraggable<T> = setIdAndParent(draggableItem, parent);
    if (subItems && subItems.length > 0) {
      return {
        ...itemWithId,
        value: {
          ...itemWithId.value,
          items: mapWithParent<T>(subItems as T[], itemWithId, itemsProperty),
        },
      };
    }
    return itemWithId;
  }) as IDraggable<T>[];

const mapWithID = <T>(items: IDraggable<T>[]) => items.map(item => setIdAndParent(item));

const removeChildFromParent = <T>(state: IDnDContextState<T>, newItem: IDraggable<T>) => {
  if (newItem.parent) {
    const indexOfCurrentParent = state.activeItems.findIndex(ai => ai.id === newItem.parent!.id);
    state.setActiveItems((prevActiveItems: IDraggable<any>[]) => {
      const index = prevActiveItems[indexOfCurrentParent].value.items.findIndex(
        (ai: IDraggable<T>) => ai.id === newItem.id
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
  state: IDnDContextState<T>,
  indexOfNewItem: number,
  newItem: IDraggable<T>,
  parent: IDraggable<T>
) => {
  removeItemFromList(state.setActiveItems, indexOfNewItem);
  state.setActiveItems((prevActiveItems: IDraggable<any>[]) => {
    const indexOfParent = findItemIndex(prevActiveItems, parent);
    if (indexOfParent > -1) {
      return prevActiveItems[indexOfParent].value.items
        ? update(prevActiveItems, {
            [indexOfParent]: {
              value: {
                items: {
                  $push: [
                    {
                      ...omit(newItem, ['parent', 'container', 'value.items']),
                      parent,
                    },
                  ],
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
  <T>(state: IDnDContextState<T>) =>
  (newItem: IDraggable<T>, parent?: IDraggable<T>) => {
    removeChildFromParent(state, newItem);
    const indexOfNewItem = findItemIndex(state.activeItems, newItem);
    if (parent) {
      addItemToParent(state, indexOfNewItem, newItem, parent);
    } else if (indexOfNewItem === -1) {
      state.setActiveItems((prevActiveItems: IDraggable<T>[]) =>
        update(prevActiveItems, {
          //@ts-ignore
          $push: [omit(newItem, ['parent', 'container', 'value.items'])],
        })
      );
    }
    const indexOfSource = findItemIndex(state.availableItems, newItem);
    removeItemFromList(state.setAvailableItems, indexOfSource);
  };

const removeActiveItem =
  <T>(state: IDnDContextState<T>) =>
  (item: IDraggable<T>) => {
    if (item.parent !== undefined) {
      removeChildFromParent(state, item);
    } else {
      const index = findItemIndex(state.activeItems, item);
      removeItemFromList(state.setActiveItems, index);
    }
    const availableSubItems: IDraggable<T>[] = (item.value.items || []).map((ai: IDraggable<T>) =>
      omit(ai, ['parent', 'container'])
    );
    const releasedItem = omit(item, ['parent', 'container', 'value.items']);
    state.setAvailableItems((prevAvailableItems: IDraggable<T>[]) =>
      update(prevAvailableItems, {
        //@ts-ignore
        $push: [releasedItem, ...availableSubItems],
      })
    );
  };

const sortChildren = <T>(
  state: IDnDContextState<T>,
  {
    currentItem,
    target,
    dragIndex,
    hoverIndex,
  }: { currentItem: IDraggable<T>; target: IDraggable<T>; dragIndex: number; hoverIndex: number }
) => {
  const indexOfParent = findItemIndex(state.activeItems, currentItem.parent!);
  const targetIndex = findItemIndex(state.activeItems[indexOfParent].value.items || [], target);
  if (targetIndex === hoverIndex) {
    state.setActiveItems((prevActiveItems: IDraggable<any>[]) =>
      update(prevActiveItems, {
        [indexOfParent]: {
          value: {
            items: {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, prevActiveItems[indexOfParent].value.items[dragIndex]],
              ],
            },
          },
        },
      })
    );
  }
};

const sortParents = <T>(
  state: IDnDContextState<T>,
  {
    target,
    dragIndex,
    hoverIndex,
  }: { currentItem: IDraggable<T>; target: IDraggable<T>; dragIndex: number; hoverIndex: number }
) => {
  const targetIndex = findItemIndex(state.activeItems, target);
  if (targetIndex === hoverIndex) {
    state.setActiveItems((prevActiveItems: IDraggable<T>[]) =>
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
  <T>(state: IDnDContextState<T>) =>
  (currentItem: IDraggable<T>, target: IDraggable<T>, dragIndex: number, hoverIndex: number) => {
    if (currentItem.parent !== undefined) {
      sortChildren(state, { currentItem, target, dragIndex, hoverIndex });
    } else {
      sortParents(state, { currentItem, target, dragIndex, hoverIndex });
    }
    if (state.operations.sortCallback) {
      state.operations.sortCallback(state.activeItems.map(item => item.value));
    }
  };

export type { IDnDContext, IDnDContextState, IDnDOperations };
export { addActiveItem, removeActiveItem, sortActiveItems, mapWithParent, mapWithID };
