import * as types from 'app/Templates/actions/actionTypes';

export function editProperty(id) {
  return {
    type: types.EDIT_PROPERTY,
    id
  };
}

export function setThesauris(thesauris) {
  return {
    type: types.SET_THESAURIS,
    thesauris
  };
}
