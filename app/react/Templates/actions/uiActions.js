import * as types from '~/Templates/actions/actionTypes';

export function editProperty(index) {
  return {
    type: types.EDIT_PROPERTY,
    index
  };
}
