import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import {browserHistory} from 'react-router';

import * as types from 'app/Pages/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Pages/PagesAPI';

export function resetPage() {
  return function (dispatch) {
    dispatch(formActions.reset('page.data'));
    dispatch(formActions.setInitial('page.data'));
  };
}

export function savePage(data) {
  return function (dispatch) {
    dispatch({type: types.SAVING_PAGE});
    return api.save(data)
    .then((response) => {
      dispatch(notify('Saved successfully.', 'success'));
      dispatch(formActions.merge('page.data', {_id: response._id, sharedId: response.sharedId, _rev: response._rev}));
      dispatch({type: types.PAGE_SAVED, data: response});
      browserHistory.push(`/settings/pages/edit/${response.sharedId}`);
    });
  };
}

export function deletePage(page) {
  return function (dispatch) {
    return api.delete(page)
    .then(() => {
      dispatch(actions.remove('pages', page));
    });
  };
}
