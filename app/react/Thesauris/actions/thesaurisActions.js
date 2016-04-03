import * as types from '~/Thesauris/actions/actionTypes';

export function editThesauri(thesauri) {
  return {
    type: types.EDIT_THESAURI,
    thesauri
  };
}

export function setThesauris(thesauris) {
  return {
    type: types.SET_THESAURIS,
    thesauris
  };
}
