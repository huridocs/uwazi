import { Dispatch } from 'redux';
import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { RequestParams } from 'app/utils/RequestParams';
import { IStore } from 'app/istore';
import { UserRole } from 'shared/types/userSchema';
import api from 'app/Users/UsersAPI';
import * as actions from '../actions';

describe('User actions', () => {
  let dispatch: Dispatch<IStore>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'delete').and.callFake(async () => Promise.resolve());
    spyOn(api, 'save').and.callFake(async () => Promise.resolve());
    spyOn(api, 'new').and.callFake(async () => Promise.resolve({ _id: 'newUserId' }));
    spyOn(api, 'get').and.callFake(async () => Promise.resolve());
    spyOn(basicActions, 'remove').and.returnValue('USER REMOVED');
    spyOn(basicActions, 'update').and.returnValue('USER UPDATED');
    spyOn(basicActions, 'set').and.returnValue('USERS SET');
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('deleteUser', () => {
    it('should delete the user', () => {
      actions.deleteUser({ _id: '231' })(dispatch);
      expect(api.delete).toHaveBeenCalledWith(new RequestParams({ _id: '231' }));
    });

    describe('upon success', () => {
      beforeEach(async () => {
        await actions.deleteUser({ _id: 'user1' })(dispatch);
      });

      it('should remove user', () => {
        expect(basicActions.remove).toHaveBeenCalledWith('users', { _id: 'user1' });
        expect(dispatch).toHaveBeenCalledWith('USER REMOVED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });

  describe('saveUser', () => {
    const username = 'Spidey';
    const email = 'peter@parker.com';

    it('should create a new user', async () => {
      const newUser = { username, email, role: UserRole.EDITOR, password: 'pass' };
      await actions.newUser(newUser)(dispatch);
      expect(api.new).toHaveBeenCalledWith(
        new RequestParams({ username, email, role: UserRole.EDITOR, password: 'pass' })
      );
      const storedUser = { _id: 'newUserId', username, email, role: UserRole.EDITOR };
      expect(dispatch).toHaveBeenCalledWith({
        type: 'users/PUSH',
        value: { ...storedUser },
      });
    });

    it('should save an existing user', async () => {
      await actions.saveUser({ username, email, role: UserRole.EDITOR })(dispatch);
      expect(api.save).toHaveBeenCalledWith(
        new RequestParams({ username, email, role: UserRole.EDITOR })
      );
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions
          .saveUser({ username, email, role: UserRole.EDITOR })(dispatch)
          .then(() => {
            done();
          })
          .catch(e => {
            fail(e);
          });
      });

      it('should update user', () => {
        expect(basicActions.update).toHaveBeenCalledWith('users', {
          username,
          email,
          role: UserRole.EDITOR,
        });
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });

  describe('loadUsers', () => {
    it('should dispatch the fetched users', async () => {
      await actions.loadUsers()(dispatch);
      expect(api.get).toHaveBeenCalledWith({ data: undefined, headers: {} });
      expect(dispatch).toHaveBeenCalledWith('USERS SET');
    });
  });
});
