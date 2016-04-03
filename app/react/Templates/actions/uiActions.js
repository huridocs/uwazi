import * as types from '~/Templates/actions/actionTypes';

export function editProperty(id) {
  return {
    type: types.EDIT_PROPERTY,
    id
  };
}

export function setThesauri(thesauri) {
  return {
    type: types.SET_THESAURI,
    thesauri
  };
}
