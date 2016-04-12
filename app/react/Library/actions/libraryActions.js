import * as types from 'app/Library/actions/actionTypes';

export function setDocuments(documents) {
  return {type: types.SET_DOCUMENTS, documents};
}
