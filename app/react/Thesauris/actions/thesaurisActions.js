import * as types from 'app/Thesauris/actions/actionTypes';
import api from 'app/Thesauris/ThesaurisAPI';
import {actions as formActions} from 'react-redux-form';

export function editThesauri(thesauri) {
  return function (dispatch) {
    dispatch(formActions.load('thesauri.data', thesauri));
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
