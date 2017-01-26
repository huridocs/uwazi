import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import * as types from 'app/Settings/actions/actionTypes';
import api from 'app/Settings/SettingsAPI';
import {notify} from 'app/Notifications';
import {editLink} from 'app/Settings/actions/uiActions';

import ID from 'shared/uniqueID';

export function loadLinks(links) {
  return formActions.load('settings.navlinksData', {links});
}

export function addLink(links) {
  const link = {title: `Item ${links.length + 1}`, localID: ID()};
  return function (dispatch) {
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
  return function (dispatch) {
    dispatch({type: types.SAVING_NAVLINKS});
    return api.save(data)
    .then((response) => {
      dispatch({type: types.NAVLINKS_SAVED, data: response});
      dispatch(actions.set('settings/collection', response));
      dispatch(notify('Saved successfully.', 'success'));
    });
  };
}
