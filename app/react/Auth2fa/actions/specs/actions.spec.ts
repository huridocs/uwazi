/** @format */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { RequestParams } from 'app/utils/RequestParams';
import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';

import { UserRole } from 'shared/types/userSchema';
import * as actions from '../actions';
import Auth2faAPI from '../../Auth2faAPI';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Auth2fa Actions', () => {
  let dispatch: jasmine.Spy;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(basicActions, 'update').and.returnValue('USER UPDATED');
    spyOn(Auth2faAPI, 'reset2fa').and.callFake(async () => Promise.resolve());
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('enable2fa', () => {
    it('should set the using2fa value of the user to "true"', () => {
      const expectedActions = [{ type: 'auth/user/SET_IN', key: 'using2fa', value: true }];

      const store = mockStore({});

      store.dispatch(actions.enable2fa());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('reset2fa', () => {
    beforeEach(async () => {
      const action = actions.reset2fa({
        _id: '231',
        email: 'some@email.com',
        username: 'user1',
        role: UserRole.EDITOR,
      });
      await action(dispatch);
    });

    it("should reset the user's 2fa credentials", () => {
      expect(Auth2faAPI.reset2fa).toHaveBeenCalledWith(new RequestParams({ _id: '231' }));
    });

    describe('upon success', () => {
      it('should update user', () => {
        expect(basicActions.update).toHaveBeenCalledWith('users', {
          _id: '231',
          email: 'some@email.com',
          using2fa: false,
          role: 'editor',
          username: 'user1',
        });
        expect(dispatch).toHaveBeenCalledWith('USER UPDATED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });
});
