import { UniqueIdentifier } from '@dnd-kit/core';
import { cloneDeep } from 'lodash';
import { TableRow, TableProps } from './Table';

const getRowIds = <T extends TableRow<T>>(data: TableProps<T>['data']) => {
  const identifiers: { id: UniqueIdentifier; parentId?: string }[] = [];

  data.forEach(element => {
    identifiers.push({ id: element.rowId });

    if (element.subRows?.length) {
      element.subRows.forEach(subElement => {
        identifiers.push({ id: subElement.rowId, parentId: element.rowId });
      });
    }

    if (element.subRows?.length === 0) {
      identifiers.push({ id: `${element.rowId}-dropzone`, parentId: element.rowId });
    }
  });

  return identifiers;
};

// eslint-disable-next-line max-statements
const dndSortHandler = <T extends TableRow<T>>({
  currentState,
  dataIds,
  activeId,
  overId,
  disableEditingGroups,
}: {
  currentState: TableProps<T>['data'];
  dataIds: { id: UniqueIdentifier; parentId?: string }[];
  activeId: string | number;
  overId: string | number;
  disableEditingGroups?: boolean;
}): TableProps<T>['data'] => {
  const state = cloneDeep(currentState);

  const { activeParent, overParent } = dataIds.reduce(
    (acc, { id, parentId }) => {
      if (id === activeId) acc.activeParent = parentId;
      if (id === overId) acc.overParent = parentId;
      return acc;
    },
    { activeParent: undefined, overParent: undefined } as {
      activeParent?: string;
      overParent?: string;
    }
  );

  if (disableEditingGroups && activeParent !== overParent) {
    return currentState;
  }

  const { active: activePosition = 0, dropped: droppedPosition = 0 } = state.reduce(
    // eslint-disable-next-line max-statements
    ({ active, dropped }, item, index) => {
      let droppedIndex = dropped;
      let activeIndex = active;

      if (active === undefined) {
        if (item.rowId === activeParent) {
          activeIndex = item.subRows?.findIndex(element => element.rowId === activeId) || 0;
        } else if (item.rowId === activeId) {
          activeIndex = index;
        }
      }

      if (dropped === undefined) {
        if (item.rowId === overParent) {
          droppedIndex = item.subRows?.findIndex(element => element.rowId === overId) || 0;
        } else if (item.rowId === overId) {
          droppedIndex = index;
        }
      }

      return {
        active: activeIndex,
        dropped: droppedIndex,
      };
    },
    {
      active: undefined,
      dropped: undefined,
    } as {
      active?: number;
      dropped?: number;
    }
  );

  const activeElement = activeParent
    ? state.find(item => item.rowId === activeParent)?.subRows?.splice(activePosition, 1)[0]
    : state.splice(activePosition || 0, 1)[0];

  if (!activeElement || (Object.hasOwn(activeElement, 'subRows') && overParent)) {
    return currentState;
  }

  if (overParent) {
    state
      .find(item => item.rowId === overParent)
      ?.subRows?.splice(droppedPosition, 0, activeElement);
  } else {
    state.splice(droppedPosition, 0, activeElement);
  }

  return state;
};

export { getRowIds, dndSortHandler };
