import documentReducer from 'app/Viewer/reducers/documentReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('documentReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = documentReducer();
      expect(newState).toEqual({pages: [], css: ''});
    });
  });

  describe('SET_DOCUMENT', () => {
    it('should set document passed', () => {
      let newState = documentReducer(null, {type: types.SET_DOCUMENT, document: {title: 'test'}});
      let expected = {title: 'test'};

      expect(newState).toEqual(expected);
    });
  });

  describe('RESET_DOCUMENT', () => {
    it('should set document to initialState', () => {
      let newState = documentReducer({}, {type: types.RESET_DOCUMENT_VIEWER});

      expect(newState).toEqual({pages: [], css: ''});
    });
  });
});
