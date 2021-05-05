/** @format */

import api from 'app/utils/api';
import { actions } from 'app/BasicReducer';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { RequestParams } from 'app/utils/RequestParams';

export function login(credentials) {
  const request = new RequestParams(credentials);
  return async dispatch => {
    await api.post('login', request);
    const user = await api.get('user');
    dispatch(actions.set('auth/user', user.json));
  };
}

export function recoverPassword(email, altMessage) {
  const request = new RequestParams({ email });
  return dispatch =>
    api.post('recoverpassword', request).then(() => {
      dispatch(
        notify(
          !altMessage
            ? 'Instructions to reset your password have been sent, please check your email'
            : altMessage,
          'success'
        )
      );
    });
}

export function resetPassword(password, key) {
  const request = new RequestParams({ password, key });
  return dispatch =>
    api.post('resetpassword', request).then(() => {
      dispatch(notify('Password changed success', 'success'));
    });
}

export function unlockAccount(credentials) {
  const request = new RequestParams(credentials);
  return dispatch =>
    api.post('unlockaccount', request).then(() => {
      dispatch(notify('Account unlocked successfully', 'success'));
    });
}
