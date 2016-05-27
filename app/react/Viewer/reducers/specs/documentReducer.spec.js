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
    it('should set document and html passed', () => {
      let newState = documentReducer(null, {
        type: types.SET_DOCUMENT,
        document: {_id: 'docid', title: 'test'},
        html: {_id: 'htmlid', pages: ['pages'], css: 'css', fonts: 'fonts'}
      });
      let expected = {_id: 'docid', title: 'test', pages: ['pages'], css: 'css', fonts: 'fonts'};

      expect(newState).toEqual(expected);
    });
  });

  describe('RESET_DOCUMENT', () => {
    it('should set document to initialState', () => {
      let newState = documentReducer({}, {type: types.RESET_DOCUMENT_VIEWER});

      expect(newState).toEqual({pages: [], css: ''});
    });
  });

  describe('VIEWER_UPDATE_DOCUMENT', () => {
    it('should merge document', () => {
      let newState = documentReducer(
        {metadata: {test: 'test'}},
        {type: types.VIEWER_UPDATE_DOCUMENT, doc: {metadata: {test2: 'test2', test: 'newOne'}}}
      );

      expect(newState).toEqual({metadata: {test2: 'test2', test: 'newOne'}});
    });
  });
});
