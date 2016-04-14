import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import uiReducer from 'app/Library/reducers/uiReducer';
import 'jasmine-immutablejs-matchers';

describe('uiReducer', () => {
  const initialState = Immutable.fromJS({searchTerm: '', previewDoc: ''});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_SEARCHTERM', () => {
    it('should set the searchTerm in the state', () => {
      let newState = uiReducer(initialState, {type: types.SET_SEARCHTERM, searchTerm: 'something cool'});
      expect(newState).toEqualImmutable(Immutable.fromJS({searchTerm: 'something cool', previewDoc: ''}));
    });
  });

  describe('SET_PREVIEW_DOC', () => {
    it('should set the searchTerm in the state', () => {
      let newState = uiReducer(initialState, {type: types.SET_PREVIEW_DOC, docId: 'docId'});
      expect(newState).toEqualImmutable(Immutable.fromJS({searchTerm: '', previewDoc: 'docId'}));
    });
  });
});
