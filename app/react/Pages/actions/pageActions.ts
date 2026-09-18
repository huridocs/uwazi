import { AppDispatch } from '#app/thunkDispatch.js';
import { actions as formActions } from 'react-redux-form';

import { actions } from '#app/BasicReducer/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { notificationActions } from '#app/Notifications/index.js';
import { PagesAPI as api } from '#app/Pages/PagesAPI.js';
import { t } from '#app/I18N/index.js';
import * as types from '#app/Pages/actions/actionTypes.js';

import { PageType } from '#shared/types/pageType.js';

export function loadPages() {
  return async (dispatch: AppDispatch) => {
    const pages = await api.get(new RequestParams());
    dispatch(actions.set('pages', pages));
  };
}

export function resetPage() {
  return (dispatch: AppDispatch) => {
    dispatch(formActions.reset('page.data'));
    dispatch(formActions.setInitial('page.data'));
  };
}

export function updateValue(model: string, value: any) {
  return (dispatch: AppDispatch) => {
    dispatch(formActions.change(`page.data${model}`, value));
  };
}

export function savePage(data: PageType, navigate: Function) {
  return (dispatch: AppDispatch) => {
    dispatch({ type: types.SAVING_PAGE });
    return api
      .save(new RequestParams(data))
      .then(async (response: PageType & { _rev: any }) => {
        dispatch(
          notificationActions.notify(t('System', 'Saved successfully.', null, false), 'success')
        );
        dispatch(
          formActions.merge('page.data', {
            _id: response._id,
            sharedId: response.sharedId,
            _rev: response._rev,
          })
        );
        dispatch({ type: types.PAGE_SAVED, data: response });
        navigate(`/settings/pages/edit/${response.sharedId}`);
      })
      .catch(() => {
        dispatch({ type: types.PAGE_SAVED, data: {} });
      });
  };
}

export function deletePage(page: PageType) {
  return (dispatch: AppDispatch) =>
    api.delete(new RequestParams({ sharedId: page.sharedId })).then(() => {
      dispatch(actions.remove('pages', page));
    });
}
