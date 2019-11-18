/** @format */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Auth2fa Actions', () => {
  describe('enable2fa', () => {
    it('should set the using2fa value of the user to "true"', () => {
      const expectedActions = [{ type: 'auth/user/SET_IN', key: 'using2fa', value: true }];

      const store = mockStore({});

      store.dispatch(actions.enable2fa());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
