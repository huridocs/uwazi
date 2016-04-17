import targetDocumentReducer from 'app/Viewer/reducers/targetDocumentReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('targetDocumentReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = targetDocumentReducer();
      expect(newState).toEqual({pages: [], css: []});
    });
  });

  describe('SET_TARGET_DOCUMENT', () => {
    it('should set document passed', () => {
      let newState = targetDocumentReducer(null, {type: types.SET_TARGET_DOCUMENT, document: {title: 'test'}});
      let expected = {title: 'test'};

      expect(newState).toEqual(expected);
    });
  });

  describe('RESET_DOCUMENT', () => {
    it('should set document to initialState', () => {
      let newState = targetDocumentReducer({}, {type: types.RESET_DOCUMENT_VIEWER});

      expect(newState).toEqual({pages: [], css: []});
    });
  });

  describe('RESET_REFERENCE_CREATION', () => {
    it('should set document to initialState', () => {
      let newState = targetDocumentReducer({}, {type: types.RESET_REFERENCE_CREATION});

      expect(newState).toEqual({pages: [], css: []});
    });
  });
});
