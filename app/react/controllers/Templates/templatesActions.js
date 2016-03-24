import * as types from './actionTypes';

export function addField(fieldConfig = {}) {
  return {
    type: types.ADD_FIELD,
    config: fieldConfig
  };
}

export function removeField(index) {
  return {
    type: types.REMOVE_FIELD,
    index: index
  };
}
