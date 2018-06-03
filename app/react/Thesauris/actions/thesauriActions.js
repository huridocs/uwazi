import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';

import * as types from 'app/Thesauris/actions/actionTypes';
import api from 'app/Thesauris/ThesaurisAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';


export function saveThesauri(thesauri) {
  return dispatch => api.save(thesauri).then((_thesauri) => {
    dispatch({ type: types.THESAURI_SAVED });
    notifications.notify(t('System', 'Thesaurus saved'), 'success')(dispatch);
    dispatch(formActions.change('thesauri.data', _thesauri));
  });
}

export function addValue(group) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    if (group !== undefined) {
      values[group] = Object.assign({}, values[group]);
      values[group].values = values[group].values.slice(0);
      values[group].values.push({ label: '' });
    } else {
      values.push({ label: '' });
    }

    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function addGroup() {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    const lastIndex = values.length - 1;
    const newGroup = { label: '', values: [{ label: '' }] };
    if (!values[lastIndex].values) {
      values[lastIndex] = newGroup;
    } else {
      values.push(newGroup);
    }
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function removeValue(index) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    values.splice(index, 1);
    dispatch(formActions.change('thesauri.data.values', values));
  };
}
