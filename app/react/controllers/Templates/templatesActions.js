import * as types from './actionTypes';

export function addField(config = {}, index = 0) {
  return {
    type: types.ADD_FIELD,
    config,
    index
  };
}

export function removeField(index) {
  return {
    type: types.REMOVE_FIELD,
    index
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return {
    type: types.REORDER_PROPERTY,
    originIndex,
    targetIndex
  };
}
