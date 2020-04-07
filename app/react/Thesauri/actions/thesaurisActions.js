import { actions } from 'app/BasicReducer';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import api from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as formActions } from 'react-redux-form';

export function editThesaurus(thesaurus) {
  return dispatch => {
    dispatch(formActions.reset('thesauri.data'));
    dispatch(formActions.load('thesauri.data', thesaurus));
  };
}

export function deleteThesaurus(thesaurus) {
  return dispatch =>
    api.delete(new RequestParams({ _id: thesaurus._id })).then(() => {
      dispatch(actions.remove('dictionaries', thesaurus));
    });
}

export function checkThesaurusCanBeDeleted(thesaurus) {
  return dispatch =>
    TemplatesAPI.countByThesauri(new RequestParams({ _id: thesaurus._id })).then(count =>
      count ? Promise.reject() : dispatch
    );
}

export function reloadThesauri() {
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}
