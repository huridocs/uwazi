import UsersAPI from '../UsersAPI';
import {actions as basicActions} from 'app/BasicReducer';
import {notify} from 'app/Notifications';

export function deleteUser(user) {
  return function (dispatch) {
    return UsersAPI.delete(user)
    .then(() => {
      dispatch(basicActions.remove('users', user));
      dispatch(notify('Deleted successfully.', 'success'));
    });
  };
}
