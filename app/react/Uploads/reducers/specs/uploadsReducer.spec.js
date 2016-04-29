import Immutable from 'immutable';
import * as types from 'app/Uploads/actions/actionTypes';

import uploadsReducer from 'app/Uploads/reducers/uploadsReducer';
import 'jasmine-immutablejs-matchers';

describe('uploadsReducer', () => {
  const initialState = Immutable.fromJS([]);

  describe('when state is undefined', () => {
    it('returns default state', () => {
      let newState = uploadsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_UPLOADS', () => {
    it('should set the documents in the state', () => {
      let documents = [{title: 'Song of Ice and Fire: The Winds of Winter'}, {title: 'Song of Ice and Fire: A Dream of Spring'}];
      let newState = uploadsReducer(initialState, {type: types.SET_UPLOADS, documents});
      expect(newState).toEqualImmutable(Immutable.fromJS(documents));
    });
  });
});
