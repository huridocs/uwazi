import * as actions from 'app/Library/actions/filterActions';
import * as types from 'app/Library/actions/actionTypes';

describe('filterActions', () => {
  describe('filterDocumentType', () => {
    it('should return an action FILTER_DOCUMENT_TYPE with the given type', () => {
      let action = actions.filterDocumentType('aDocType');
      expect(action).toEqual({type: types.FILTER_DOCUMENT_TYPE, documentType: 'aDocType'});
    });
  });
});
