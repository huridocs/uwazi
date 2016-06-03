import api from 'app/utils/api';
import {actions} from 'app/BasicReducer';

export function login(credentials) {
  return function (dispatch) {
    return api.post('login', credentials)
    .then(() => api.get('user'))
    .then((user) => {
      dispatch(actions.set('auth/user', user.json));
    });
  };
}
