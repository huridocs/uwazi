import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import documentsReducer from 'app/Library/reducers/documentsReducer';
import 'jasmine-immutablejs-matchers';

describe('documentsReducer', () => {
  const initialState = Immutable.fromJS([]);

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = documentsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_DOCUMENTS', () => {
    it('should set the documents in the state', () => {
      let documents = [{title: 'Song of Ice and Fire: The Winds of Winter'}, {title: 'Song of Ice and Fire: A Dream of Spring'}];
      let newState = documentsReducer(initialState, {type: types.SET_DOCUMENTS, documents});
      expect(newState).toEqualImmutable(Immutable.fromJS(documents));
    });
  });
});
