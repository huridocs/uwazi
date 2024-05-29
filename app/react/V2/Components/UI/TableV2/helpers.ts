import { UniqueIdentifier } from '@dnd-kit/core';
import { TableProps } from './Table';

const getDataIds = <T extends { rowId: string; subRows?: { rowId: string }[] }>(
  data: TableProps<T>['data']
) => {
  const identifiers: { id: UniqueIdentifier; isChild?: boolean }[] = [];

  data.forEach(element => {
    identifiers.push({ id: element.rowId });

    if (element.subRows?.length) {
      element.subRows.forEach(subElement => {
        identifiers.push({ id: subElement.rowId, isChild: true });
      });
    }
  });

  return identifiers;
};

const dndSortHandler = <T extends { rowId: string; subRows?: { rowId: string }[] }>(
  currentState: TableProps<T>['data'],
  dataIds: { id: UniqueIdentifier; isChild?: boolean }[],
  activeId: string | number,
  overId: string | number
): TableProps<any>['data'] => {
  const state = [...currentState];

  const activePosition = state.findIndex(element => element.rowId === activeId);
  const droppedPosition = state.findIndex(element => element.rowId === overId);

  const element = state.splice(activePosition, 1)[0];
  state.splice(droppedPosition, 0, element);

  return state;
};

export { dndSortHandler, getDataIds };
