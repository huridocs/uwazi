import * as types from 'app/Library/actions/actionTypes';
import libraryHelper from 'app/Library/helpers/libraryFilters';

export function filterDocumentType(documentType, documentTypes, templates, thesauris) {
  documentTypes[documentType] = !documentTypes[documentType];
  let libraryFilters = libraryHelper.libraryFilters(templates, documentTypes, thesauris);
  return {type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters};
}

export function filterAllDocumentTypes(newValue, documentTypes, templates, thesauris) {
  Object.keys(documentTypes).forEach((key) => {
    documentTypes[key] = newValue;
  });
  let libraryFilters = libraryHelper.libraryFilters(templates, documentTypes, thesauris);
  return {type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters};
}
