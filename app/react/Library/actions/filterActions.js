import * as types from 'app/Library/actions/actionTypes';

export function filterDocumentType(documentType) {
  return {type: types.TOGGLE_FILTER_DOCUMENT_TYPE, documentType};
}

export function filterAllDocumentTypes(value) {
  return {type: types.TOGGLE_ALL_FILTER_DOCUMENT_TYPE, value};
}
