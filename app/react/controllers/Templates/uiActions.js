import * as types from './actionTypes';

export function editProperty(index) {
  return {
    type: types.EDIT_PROPERTY,
    index
  };
}
