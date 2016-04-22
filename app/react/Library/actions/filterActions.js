import * as types from 'app/Library/actions/actionTypes';

export function filterDocumentType(documentType) {
  return {type: types.FILTER_DOCUMENT_TYPE, documentType};
}
