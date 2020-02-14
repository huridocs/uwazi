import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { RequestParams } from 'app/utils/RequestParams';
import UsersAPI from '../UsersAPI';

export function deleteUser(user) {
  return dispatch =>
    UsersAPI.delete(new RequestParams(user)).then(() => {
      dispatch(basicActions.remove('users', user));
      dispatch(notificationActions.notify('Deleted successfully.', 'success'));
    });
}

export function saveUser(user) {
  return dispatch =>
    UsersAPI.save(new RequestParams(user)).then(() => {
      dispatch(basicActions.push('users', user));
      dispatch(notificationActions.notify('Saved successfully.', 'success'));
    });
}

export function newUser(user) {
  return dispatch =>
    UsersAPI.new(new RequestParams(user)).then(() => {
      dispatch(basicActions.push('users', user));
      dispatch(notificationActions.notify('Created successfully.', 'success'));
    });
}
