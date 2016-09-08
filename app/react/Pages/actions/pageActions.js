import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';

import * as types from 'app/Pages/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Pages/PagesAPI';

export function resetPage() {
  return function (dispatch) {
    dispatch(formActions.reset('page.data'));
  };
}

export function savePage(data) {
  return function (dispatch) {
    dispatch({type: types.SAVING_PAGE});
    return api.save(data)
    .then((response) => {
      dispatch({type: types.PAGE_SAVED, data: response});

      dispatch(formActions.merge('page.data', {_id: response.id, _rev: response.rev}));
      dispatch(notify('Saved successfully.', 'success'));
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
