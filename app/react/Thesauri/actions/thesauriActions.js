import { actions as formActions } from 'react-redux-form';
import { t } from '#app/I18N/index.js';
import * as types from '../../Thesauri/actions/actionTypes.js';
import api from '../../Thesauri/ThesauriAPI.js';
import * as notifications from '../../Notifications/actions/notificationsActions.js';
import { RequestParams } from '#app/utils/RequestParams.js';

export function saveThesaurus(thesaurus) {
  return dispatch =>
    api.save(new RequestParams(thesaurus)).then(_thesauri => {
      dispatch({ type: types.THESAURI_SAVED });
      notifications.notify(t('System', 'Thesaurus saved', null, false), 'success')(dispatch);
      dispatch(formActions.change('thesauri.data', _thesauri));
    });
}
