import * as types from 'app/Library/actions/actionTypes';
import api from 'app/Library/DocumentsAPI';

export function setDocuments(documents) {
  return {type: types.SET_DOCUMENTS, documents};
}

export function setSearchTerm(searchTerm) {
  return {type: types.SET_SEARCHTERM, searchTerm};
}

export function setPreviewDoc(docId) {
  return {type: types.SET_PREVIEW_DOC, docId};
}

export function searchDocuments(searchTerm) {
  return (dispatch) => {
    return api.search(searchTerm)
    .then((documents) => {
      dispatch({type: types.SET_DOCUMENTS, documents});
      dispatch({type: types.HIDE_SUGGESTIONS});
    });
  };
}

export function getSuggestions(searchTerm) {
  return (dispatch) => {
    return api.search(searchTerm)
    .then((suggestions) => {
      dispatch({type: types.SET_SUGGESTIONS, suggestions});
      dispatch({type: types.SHOW_SUGGESTIONS});
    });
  };
}
