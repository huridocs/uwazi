import { UniqueIdentifier } from '@dnd-kit/core';
import { Row } from 'react-table';
import { cloneDeep } from 'lodash';
import { TableProps } from './Table';

const getDataIds = <T extends { rowId: string; subRows?: { rowId: string }[] }>(
  data: TableProps<T>['dataState'][0]
) => {
  const identifiers: { id: UniqueIdentifier; parentId?: string }[] = [];

  data.forEach(element => {
    identifiers.push({ id: element.rowId });

    if (element.subRows?.length) {
      element.subRows.forEach(subElement => {
        identifiers.push({ id: subElement.rowId, parentId: element.rowId });
      });
    }
  });

  return identifiers;
};

const dndSortHandler = <T extends { rowId: string; subRows?: { rowId: string }[] }>(
  currentState: TableProps<T>['dataState'][0],
  dataIds: { id: UniqueIdentifier; parentId?: string }[],
  activeId: string | number,
  overId: string | number
): TableProps<T>['dataState'][0] => {
  const state = cloneDeep(currentState);

  const activeParent = dataIds.find(dataId => dataId.id === activeId)?.parentId;
  const overParent = dataIds.find(dataId => dataId.id === overId)?.parentId;

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

  const element = activeParent
    ? state.find(item => item.rowId === activeParent)?.subRows?.splice(activePosition, 1)[0]
    : state.splice(activePosition, 1)[0];

  if (overParent) {
    state.find(item => item.rowId === overParent)?.subRows?.splice(droppedPosition, 0, element);
  } else {
    state.splice(droppedPosition, 0, element);
  }

  return state;
};

const sortHandler = <T extends { rowId: string; subRows?: { rowId: string }[] }>(rows: Row<T>[]) =>
  rows.map(row => {
    const { original, subRows } = row;
    if (subRows.length) {
      original.subRows = subRows.map(subRow => subRow.original);
    }
    return original;
  });

export { getDataIds, dndSortHandler, sortHandler };
