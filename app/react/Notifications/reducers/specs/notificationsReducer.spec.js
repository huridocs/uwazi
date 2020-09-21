import Immutable from 'immutable';

import notificationsReducer from 'app/Notifications/reducers/notificationsReducer';
import * as types from 'app/Notifications/actions/actionTypes';

describe('templateReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      const newState = notificationsReducer();
      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('NOTIFY', () => {
    it('should add a notification', () => {
      const currentState = Immutable.fromJS([{ message: 'message' }]);
      const newState = notificationsReducer(currentState, {
        type: types.NOTIFY,
        notification: { message: 'another message' },
      });
      const expected = Immutable.fromJS([{ message: 'message' }, { message: 'another message' }]);

      expect(newState instanceof Immutable.List).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('REMOVE_NOTIFICATION', () => {
    it('should add a notification', () => {
      const currentState = Immutable.fromJS([{ id: 1 }, { id: 2 }]);
      const newState = notificationsReducer(currentState, {
        type: types.REMOVE_NOTIFICATION,
        id: 2,
      });
      const expected = Immutable.fromJS([{ id: 1 }]);

      expect(newState instanceof Immutable.List).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
});
