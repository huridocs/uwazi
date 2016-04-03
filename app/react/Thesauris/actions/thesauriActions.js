import * as types from '~/Thesauris/actions/actionTypes';
import api from '~/Thesauris/ThesaurisAPI';

export function saveThesauri(thesauri) {
  return function (dispatch) {
    return api.save(thesauri).then(() => {
      dispatch({type: types.THESAURI_SAVED});
    });
  };
}
