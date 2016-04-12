import * as types from 'app/Library/actions/actionTypes';
import api from 'app/Library/DocumentsAPI';

export function setDocuments(documents) {
  return {type: types.SET_DOCUMENTS, documents};
}

export function setSearchTerm(searchTerm) {
  return {type: types.SET_SEARCHTERM, searchTerm};
}

export function searchDocuments(searchTerm) {
  return (dispatch) => {
    return api.search(searchTerm)
    .then((documents) => {
      dispatch({type: types.SET_DOCUMENTS, documents});
    });
  };
}
