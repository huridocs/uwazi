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

  describe('NEW_UPLOAD_DOCUMENT', () => {
    it('should insert the new document at the top', () => {
      let currentState = Immutable.fromJS([{title: '1'}, {title: '2'}]);
      let doc = {title: '3'};
      let newState = uploadsReducer(currentState, {type: types.NEW_UPLOAD_DOCUMENT, doc});
      expect(newState.toJS()).toEqual([{title: '3'}, {title: '1'}, {title: '2'}]);
    });
  });
});
