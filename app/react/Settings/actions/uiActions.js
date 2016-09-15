import * as types from './actionTypes';

export function editLink(id) {
  return {
    type: types.EDIT_LINK,
    id
  };
}
