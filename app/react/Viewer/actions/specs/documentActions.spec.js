import * as actions from 'app/Viewer/actions/documentActions';
import * as types from 'app/Viewer/actions/actionTypes';

describe('documentActions', () => {
  describe('setDocument()', () => {
    it('should return a SET_REFERENCES type action with the document', () => {
      let action = actions.setDocument('document');
      expect(action).toEqual({type: types.SET_DOCUMENT, document: 'document'});
    });
  });
  describe('resetDocumentViewer()', () => {
    it('should return a RESET_DOCUMENT_VIEWER', () => {
      let action = actions.resetDocumentViewer();
      expect(action).toEqual({type: types.RESET_DOCUMENT_VIEWER});
    });
  });
});
