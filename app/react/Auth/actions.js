import api from 'app/utils/api';
import {actions} from 'app/BasicReducer';
import {notify} from 'app/Notifications/actions/notificationsActions';

export function login(credentials) {
  return function (dispatch) {
    return api.post('login', credentials)
    .then(() => api.get('user'))
    .then((user) => {
      dispatch(actions.set('auth/user', user.json));
    });
  };
}

export function recoverPassword(email) {
  return function (dispatch) {
    return api.post('recoverPassword', {email})
    .then(() => {
      dispatch(notify('Instructions to reset your password have been send, please check your email', 'success'));
    });
  };
}

export function resetPassword(password, key) {
  return function (dispatch) {
    return api.post('resetPassword', {password, key})
    .then(() => {
      dispatch(notify('Password changed success', 'success'));
    });
  };
}
