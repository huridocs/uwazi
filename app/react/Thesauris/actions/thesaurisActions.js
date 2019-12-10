/** @format */
import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import api from 'app/Thesauris/ThesaurisAPI';
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

export function disableClassification(thesaurus) {
  return async dispatch => {
    const _thesaurus = { ...thesaurus, enable_classification: false };
    await api.save(new RequestParams(_thesaurus)).then(_updatedThesaurus => {
      notifications.notify(
        t('System', `${_updatedThesaurus.name} will no longer be classified.`, null, false),
        'success'
      )(dispatch);
      dispatch(
        actions.update('dictionaries', {
          ..._updatedThesaurus,
          model_available: thesaurus.model_available,
        })
      );
    });
  };
}

export function enableClassification(thesaurus) {
  return async dispatch => {
    console.dir(Object.getOwnPropertyNames(thesaurus));
    const _thesaurus = { ...thesaurus, enable_classification: true };
    await api.save(new RequestParams(_thesaurus)).then(_updatedThesaurus => {
      notifications.notify(
        t('System', `${_updatedThesaurus.name} will now be classified.`, null, false),
        'success'
      )(dispatch);
      dispatch(
        actions.update('dictionaries', {
          ..._updatedThesaurus,
          model_available: thesaurus.model_available,
        })
      );
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
