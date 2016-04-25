import * as actions from 'app/Library/actions/filterActions';
import * as types from 'app/Library/actions/actionTypes';

describe('filterActions', () => {
  describe('filterDocumentType', () => {
    it('should return an action TOGGLE_FILTER_DOCUMENT_TYPE with the given type', () => {
      let action = actions.filterDocumentType('aDocType');
      expect(action).toEqual({type: types.TOGGLE_FILTER_DOCUMENT_TYPE, documentType: 'aDocType'});
    });
  });

  describe('filterAllDocumentTypes', () => {
    it('should return an action TOGGLE_ALL_FILTER_DOCUMENT_TYPE with the given value', () => {
      let action = actions.filterAllDocumentTypes(true);
      expect(action).toEqual({type: types.TOGGLE_ALL_FILTER_DOCUMENT_TYPE, value: true});
    });
  });
});
