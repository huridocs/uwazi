import api from 'app/Thesauris/ThesaurisAPI';
import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import TemplatesAPI from 'app/Templates/TemplatesAPI';

export function editThesauri(thesauri) {
  return function (dispatch) {
    dispatch(formActions.reset('thesauri.data'));
    dispatch(formActions.load('thesauri.data', thesauri));
  };
}

export function deleteThesauri(thesauri) {
  return function (dispatch) {
    return api.delete(thesauri)
    .then(() => {
      dispatch(actions.remove('dictionaries', thesauri));
    });
  };
}

export function checkThesauriCanBeDeleted(thesauri) {
  return function () {
    return TemplatesAPI.countByThesauri(thesauri)
    .then((count) => {
      if (count) {
        return Promise.reject();
      }
    });
  };
}
