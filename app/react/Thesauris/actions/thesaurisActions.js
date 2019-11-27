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

export function checkThesauriCanBeDeleted(thesauri) {
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

export function disableClassification(thesauri) {
  return async dispatch => {
    console.dir('pre-disable', thesauri);
    const _thesauri = { ...thesauri, enableClassification: false };
    console.dir('pre-disable', _thesauri);
    // values.
    await api.save(new RequestParams(_thesauri)).then(_updatedThesauri => {
      notifications.notify(t('System', 'Classification enabled', null, false), 'success')(dispatch);
      dispatch(actions.update('dictionaries', _updatedThesauri));
    });
  };
}

export function enableClassification(thesauri) {
  return async dispatch => {
    console.dir('pre-enable', thesauri);
    const _thesauri = { ...thesauri, enableClassification: true };
    console.dir('post-enable', _thesauri);
    // values.
    await api.save(new RequestParams(_thesauri)).then(updatedThesauri => {
      notifications.notify(t('System', 'Classification enabled', null, false), 'success')(dispatch);
      dispatch(actions.update('dictionaries', updatedThesauri));
    });
  };
}

export function checkThesauriCanBeClassified(thesauri) {
  console.log('can thesauri be classified?', thesauri);
  return async dispatch => {
    const stats = await api.getClassificationStats(new RequestParams({ _id: thesauri._id }));
    if (stats && stats.can_enable) {
      return dispatch;
    }
    //return dispatch;
    throw new Error('Cannot enable!');
  };
}
