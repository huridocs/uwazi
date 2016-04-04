import Immutable from 'immutable';

import notificationsReducer from 'app/Notifications/reducers/notificationsReducer';
import * as types from 'app/Notifications/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('templateReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      let newState = notificationsReducer();
      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('NOTIFY', () => {
    it('should add a notification', () => {
      let currentState = Immutable.fromJS([{message: 'message'}]);
      let newState = notificationsReducer(currentState, {type: types.NOTIFY, notification: {message: 'another message'}});
      let expected = Immutable.fromJS([{message: 'message'}, {message: 'another message'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REMOVE_NOTIFICATION', () => {
    it('should add a notification', () => {
      let currentState = Immutable.fromJS([{id: 1}, {id: 2}]);
      let newState = notificationsReducer(currentState, {type: types.REMOVE_NOTIFICATION, id: 2});
      let expected = Immutable.fromJS([{id: 1}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
