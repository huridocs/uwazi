import api from 'app/Thesauris/ThesaurisAPI';
import { actions as formActions } from 'react-redux-form';
import { actions } from 'app/BasicReducer';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { RequestParams } from 'app/utils/RequestParams';

export function editThesauri(thesauri) {
  return (dispatch) => {
    dispatch(formActions.reset('thesauri.data'));
    dispatch(formActions.load('thesauri.data', thesauri));
  };
}

export function deleteThesauri(thesauri) {
  return dispatch => api.delete(new RequestParams({ _id: thesauri._id }))
  .then(() => {
    dispatch(actions.remove('dictionaries', thesauri));
  });
}

export function checkThesauriCanBeDeleted(thesauri) {
  return () => TemplatesAPI.countByThesauri(new RequestParams({ _id: thesauri._id }))
  .then(count => count ? Promise.reject() : null);
}

export function reloadThesauris() {
  return dispatch => api.get()
  .then((response) => {
    dispatch(actions.set('thesauris', response));
  });
}
