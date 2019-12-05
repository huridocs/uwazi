/** @format */

import api from 'app/Thesauris/ThesaurisAPI';
import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import { actions } from 'app/BasicReducer';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { RequestParams } from 'app/utils/RequestParams';

export function editThesauri(thesauri) {
  return dispatch => {
    dispatch(formActions.reset('thesauri.data'));
    dispatch(formActions.load('thesauri.data', thesauri));
  };
}

export function deleteThesauri(thesauri) {
  return dispatch =>
    api.delete(new RequestParams({ _id: thesauri._id })).then(() => {
      dispatch(actions.remove('dictionaries', thesauri));
    });
}

export function checkThesaurusCanBeDeleted(thesauri) {
  return dispatch =>
    TemplatesAPI.countByThesauri(new RequestParams({ _id: thesauri._id })).then(count =>
      count ? Promise.reject() : dispatch
    );
}

export function reloadThesauris() {
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}

export function disableClassification(thesaurus) {
  return async dispatch => {
    const _thesaurus = { ...thesaurus, enable_classification: false };
    await api.save(new RequestParams(_thesaurus)).then(_updatedThesaurus => {
      notifications.notify(t('System', 'Classification disabled', null, false), 'success')(
        dispatch
      );
      dispatch(actions.update('dictionaries', _updatedThesaurus));
    });
  };
}

export function enableClassification(thesaurus) {
  return async dispatch => {
    // TODO: figure out why the model_available field is wiped out here.
    const _thesaurus = { ...thesaurus, enable_classification: true };
    await api.save(new RequestParams(_thesaurus)).then(updatedThesaurus => {
      notifications.notify(t('System', 'Classification enabled', null, false), 'success')(dispatch);
      dispatch(actions.update('dictionaries', updatedThesaurus));
    });
  };
}

export function checkThesaurusCanBeClassified(thesaurus) {
  return async dispatch => {
    const modelAvailable = await api.getModelStatus(new RequestParams({ model: thesaurus.name }));
    if (modelAvailable && modelAvailable.preferred) {
      return dispatch;
    }
    throw new Error('Cannot enable!');
  };
}
