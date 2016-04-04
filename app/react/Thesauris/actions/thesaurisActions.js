import * as types from '~/Thesauris/actions/actionTypes';
import api from '~/Thesauris/ThesaurisAPI';

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

export function deleteThesauri(thesauri) {
  return function (dispatch) {
    return api.delete(thesauri).then(() => {
      dispatch({
        type: types.THESAURI_DELETED,
        id: thesauri._id
      });
    });
  };
}
