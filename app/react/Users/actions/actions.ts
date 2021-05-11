import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { RequestParams } from 'app/utils/RequestParams';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { UserSchema } from 'shared/types/userType';
import UsersAPI from '../UsersAPI';

export function deleteUser(user: { _id: ObjectIdSchema }) {
  return (dispatch: Dispatch<IStore>) =>
    UsersAPI.delete(new RequestParams(user)).then(() => {
      dispatch(basicActions.remove('users', user));
      dispatch(notificationActions.notify('Deleted successfully.', 'success'));
    });
}

export function saveUser(user: UserSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    await UsersAPI.save(new RequestParams(user));
    const userToNotify = { ...user };
    delete userToNotify.password;
    dispatch(basicActions.update('users', userToNotify));
    dispatch(notificationActions.notify('Saved successfully.', 'success'));
  };
}

export function newUser(user: UserSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    const createdUser = await UsersAPI.new(new RequestParams(user));
    const userToNotify = { ...user, ...createdUser };
    delete userToNotify.password;
    dispatch(basicActions.push('users', userToNotify));
    dispatch(notificationActions.notify('Created successfully.', 'success'));
  };
}

export function loadUsers() {
  return async (dispatch: Dispatch<IStore>) => {
    const users = await UsersAPI.get(new RequestParams());
    dispatch(basicActions.set('users', users));
  };
}
