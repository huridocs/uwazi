import { Dispatch } from 'redux';

import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { RequestParams } from 'app/utils/RequestParams';

import { UserSchema } from 'shared/types/userType';
import Auth2faAPI from '../Auth2faAPI';

export interface enable2faType {
  type: string;
  key: any;
  value: any;
}

export function enable2fa(): enable2faType {
  return actions.setIn('auth/user', 'using2fa', true);
}

export function reset2fa(user: UserSchema) {
  return async (dispatch: Dispatch<{}>) => {
    await Auth2faAPI.reset2fa(new RequestParams({ _id: user._id }));
    dispatch(actions.update('users', { ...user, using2fa: false }));
    dispatch(notificationActions.notify('Deleted successfully.', 'success'));
  };
}
