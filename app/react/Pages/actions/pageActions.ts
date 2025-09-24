import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';

import { actions } from '../../BasicReducer/index.js';
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../Notifications.js' or its... Remove this comment to see the full error message
import { notificationActions } from '../../Notifications.js';
import api from '../../Pages/PagesAPI.js';
import { t } from '../../I18N/index.js';
import * as types from '../../Pages/actions/actionTypes.js';

// @ts-expect-error TS(2307): Cannot find module '../../shared/types/pageType.js... Remove this comment to see the full error message
import { PageType } from 'shared/types/pageType.js';

export function loadPages() {
  return async (dispatch: Dispatch<{}>) => {
    const pages = await api.get(new RequestParams());
    dispatch(actions.set('pages', pages));
  };
}

export function resetPage() {
  return (dispatch: Dispatch<{}>) => {
    dispatch(formActions.reset('page.data'));
    dispatch(formActions.setInitial('page.data'));
  };
}

export function updateValue(model: string, value: any) {
  return (dispatch: Dispatch<{}>) => {
    dispatch(formActions.change(`page.data${model}`, value));
  };
}

export function savePage(data: PageType, navigate: Function) {
  return (dispatch: Dispatch<{}>) => {
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
  return (dispatch: Dispatch<{}>) =>
    api.delete(new RequestParams({ sharedId: page.sharedId })).then(() => {
      dispatch(actions.remove('pages', page));
    });
}
