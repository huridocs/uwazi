import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import uiReducer from 'app/Library/reducers/uiReducer';
import 'jasmine-immutablejs-matchers';

describe('uiReducer', () => {
  const initialState = Immutable.fromJS({searchTerm: '', previewDoc: '', suggestions: []});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_SEARCHTERM', () => {
    it('should set the searchTerm in the state', () => {
      let newState = uiReducer(initialState, {type: types.SET_SEARCHTERM, searchTerm: 'something cool'});
      expect(newState.toJS().searchTerm).toBe('something cool');
    });

    describe('when the searchTerm is empty', () => {
      it('should clear the suggestions', () => {
        let state = initialState.set('suggestions', ['some', 'suggestions']);
        let newState = uiReducer(state, {type: types.SET_SEARCHTERM, searchTerm: ''});
        expect(newState.toJS().suggestions).toEqual([]);
      });
    });
  });

  describe('SET_SUGGESTIONS', () => {
    it('should set the suggestions in the state', () => {
      let suggestions = [{title: 'something'}];
      let newState = uiReducer(initialState, {type: types.SET_SUGGESTIONS, suggestions});
      expect(newState.toJS().suggestions).toEqual(suggestions);
    });
  });

  describe('SHOW_FILTERS', () => {
    it('should set the filtersPanel to true', () => {
      let newState = uiReducer(initialState, {type: types.SHOW_FILTERS});
      expect(newState.toJS().filtersPanel).toBe(true);
    });
  });

  describe('HIDE_FILTERS', () => {
    it('should set the filtersPanel to false', () => {
      let newState = uiReducer(initialState, {type: types.HIDE_FILTERS});
      expect(newState.toJS().filtersPanel).toBe(false);
    });
  });

  describe('SHOW_SUGGESTIONS', () => {
    it('should set the showSuggestions to true', () => {
      let newState = uiReducer(initialState, {type: types.SHOW_SUGGESTIONS});
      expect(newState.toJS().showSuggestions).toBe(true);
    });
  });

  describe('HIDE_SUGGESTIONS', () => {
    it('should set the showSuggestions to true', () => {
      let newState = uiReducer(initialState, {type: types.HIDE_SUGGESTIONS});
      expect(newState.toJS().showSuggestions).toBe(false);
    });
  });

  describe('OVER_SUGGESTIONS', () => {
    it('should set the overSuggestions to true', () => {
      let newState = uiReducer(initialState, {type: types.OVER_SUGGESTIONS, hover: false});
      expect(newState.toJS().overSuggestions).toBe(false);

      newState = uiReducer(initialState, {type: types.OVER_SUGGESTIONS, hover: true});
      expect(newState.toJS().overSuggestions).toBe(true);
    });
  });

  describe('SET_PREVIEW_DOC', () => {
    it('should set the searchTerm in the state', () => {
      let newState = uiReducer(initialState, {type: types.SET_PREVIEW_DOC, docId: 'docId'});
      expect(newState.toJS().previewDoc).toBe('docId');
    });
  });
});
