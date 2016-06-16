import {actions as formActions} from 'react-redux-form';

import * as types from 'app/Thesauris/actions/actionTypes';
import api from 'app/Thesauris/ThesaurisAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';


export function saveThesauri(thesauri) {
  return function (dispatch) {
    return api.save(thesauri).then(() => {
      dispatch({type: types.THESAURI_SAVED});
      notifications.notify('Thesauri saved', 'success')(dispatch);
    });
  };
}

export function addValue() {
  return function (dispatch, getState) {
    let values = getState().thesauri.data.values.slice(0);
    values.push({label: ''});
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function removeValue(index) {
  return function (dispatch, getState) {
    let values = getState().thesauri.data.values.slice(0);
    values.splice(index, 1);
    dispatch(formActions.change('thesauri.data.values', values));
  };
}
