import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';

import { actions } from 'app/BasicReducer';
import { editLink } from 'app/Settings/actions/uiActions';
import { notificationActions } from 'app/Notifications';

import ID from 'shared/uniqueID';
import api from 'app/Settings/SettingsAPI';
import * as types from 'app/Settings/actions/actionTypes';

export function loadLinks(links) {
  return formActions.load('settings.navlinksData', { links });
}

export function addLink(links) {
  const link = { title: `Item ${links.length + 1}`, localID: ID() };
  return dispatch => {
    dispatch(formActions.push('settings.navlinksData.links', link));
    dispatch(editLink(link.localID));
  };
}

export function sortLink(originIndex, targetIndex) {
  return formActions.move('settings.navlinksData.links', originIndex, targetIndex);
}

export function removeLink(index) {
  return formActions.remove('settings.navlinksData.links', index);
}

export function saveLinks(data) {
  return dispatch => {
    dispatch({ type: types.SAVING_NAVLINKS });
    return api
      .save(new RequestParams(data))
      .then(response => {
        dispatch({ type: types.NAVLINKS_SAVED, data: response });
        dispatch(actions.set('settings/collection', response));
        dispatch(notificationActions.notify('Saved successfully.', 'success'));
      })
      .catch(() => {
        dispatch({ type: types.NAVLINKS_SAVED, data });
      });
  };
}
