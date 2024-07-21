import { UniqueIdentifier } from '@dnd-kit/core';
import { cloneDeep } from 'lodash';
import { RowWithId, TableProps } from './Table';

const getRowIds = <T extends RowWithId<T>>(data: TableProps<T>['data']) => {
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
const dndSortHandler = <T extends RowWithId<T>>({
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
    return state;
  }

  const activePosition = activeParent
    ? state
        .find(item => item.rowId === activeParent)
        ?.subRows?.findIndex(element => element.rowId === activeId)
    : state.findIndex(element => element.rowId === activeId);

  const droppedPosition = overParent
    ? state
        .find(item => item.rowId === overParent)
        ?.subRows?.findIndex(element => element.rowId === overId)
    : state.findIndex(element => element.rowId === overId);

  const activeElement = activeParent
    ? state.find(item => item.rowId === activeParent)?.subRows?.splice(activePosition, 1)[0]
    : state.splice(activePosition, 1)[0];

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
