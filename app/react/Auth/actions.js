/** @format */

import api from '../../utils/api.js';
import { t } from '../../I18N/index.js';
import { actions } from '../../BasicReducer/index.js';
import { notify } from '../../Notifications/actions/notificationsActions.js';
import { RequestParams } from '../../utils/RequestParams.js';

export function login(credentials) {
  const request = new RequestParams(credentials);
  return async dispatch => {
    await api.post('login', request);
    const user = await api.get('user');
    dispatch(actions.set('auth/user', user.json));
  };
}

export function recoverPassword(email) {
  const request = new RequestParams({ email });
  return dispatch =>
    api.post('recoverpassword', request).then(() => {
      dispatch(notify(t('System', 'Instructions to reset password', null, false), 'success'));
    });
}

export function resetPassword(password, key) {
  const request = new RequestParams({ password, key });
  return dispatch =>
    api.post('resetpassword', request).then(() => {
      dispatch(notify(t('System', 'Password changed success', null, false), 'success'));
    });
}

export function unlockAccount(credentials) {
  const request = new RequestParams(credentials);
  return dispatch =>
    api.post('unlockaccount', request).then(() => {
      dispatch(notify(t('System', 'Account unlocked successfully', null, false), 'success'));
    });
}
