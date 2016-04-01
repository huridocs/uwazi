import * as types from '~/Templates/actions/actionTypes';

export function editProperty(id) {
  return {
    type: types.EDIT_PROPERTY,
    id
  };
}
