import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import * as types from 'app/Thesauri/actions/actionTypes';
import api from 'app/Thesauri/ThesauriAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import { RequestParams } from 'app/utils/RequestParams';

export function saveThesaurus(thesaurus) {
  return dispatch =>
    api.save(new RequestParams(thesaurus)).then(_thesauri => {
      dispatch({ type: types.THESAURI_SAVED });
      notifications.notify(t('System', 'Thesaurus saved', null, false), 'success')(dispatch);
      dispatch(formActions.change('thesauri.data', _thesauri));
    });
}
