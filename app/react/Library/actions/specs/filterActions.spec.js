import * as actions from 'app/Library/actions/filterActions';
import * as types from 'app/Library/actions/actionTypes';

import libraryHelper from 'app/Library/helpers/libraryFilters';

describe('filterActions', () => {

  let templates = ['templates'];
  let thesauris = ['thesauris'];
  let documentTypes = {a: true, b: false};
  let libraryFilters = 'generated filters';

  beforeEach(() => {
    spyOn(libraryHelper, 'libraryFilters').and.returnValue(libraryFilters);
  });

  describe('filterDocumentType', () => {
    it('should return an action SET_LIBRARY_FILTERS with the given type', () => {
      let action = actions.filterDocumentType('a', documentTypes, templates, thesauris);
      expect(libraryHelper.libraryFilters).toHaveBeenCalledWith(templates, documentTypes, thesauris);
      expect(action).toEqual({type: types.SET_LIBRARY_FILTERS, libraryFilters, documentTypes: {a: false, b: false}});
    });
  });

  describe('filterAllDocumentTypes', () => {
    it('should return an action SET_LIBRARY_FILTERS with the given value', () => {
      let action = actions.filterAllDocumentTypes(true, documentTypes, templates, thesauris);
      expect(libraryHelper.libraryFilters).toHaveBeenCalledWith(templates, {a: true, b: true}, thesauris);
      expect(action).toEqual({type: types.SET_LIBRARY_FILTERS, libraryFilters, documentTypes: {a: true, b: true}});
    });
  });
});
