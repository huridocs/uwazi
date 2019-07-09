import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import UsersAPI from '../UsersAPI';

export function deleteUser(user) {
  return function (dispatch) {
    return UsersAPI.delete(user)
    .then(() => {
      dispatch(basicActions.remove('users', user));
      dispatch(notificationActions.notify('Deleted successfully.', 'success'));
    }).catch(() => Promise.resolve());
  };
}

export function saveUser(user) {
  return function (dispatch) {
    return UsersAPI.save(user)
    .then(() => {
      dispatch(basicActions.push('users', user));
      dispatch(notificationActions.notify('Saved successfully.', 'success'));
    }).catch(() => Promise.resolve());
  };
}

export function newUser(user) {
  return function (dispatch) {
    return UsersAPI.new(user)
    .then(() => {
      dispatch(basicActions.push('users', user));
      dispatch(notificationActions.notify('Created successfully.', 'success'));
    }).catch(() => Promise.resolve());
  };
}
