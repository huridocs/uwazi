import * as types from '~/Thesauris/actions/actionTypes';

export function editThesauri(thesauri) {
  return {
    type: types.EDIT_THESAURI,
    thesauri
  };
}
