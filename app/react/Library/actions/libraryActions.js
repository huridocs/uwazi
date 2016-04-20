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

export function setSuggestions(suggestions) {
  return {type: types.SET_SUGGESTIONS, suggestions};
}

export function hideSuggestions() {
  return {type: types.HIDE_SUGGESTIONS};
}

export function showSuggestions() {
  return {type: types.SHOW_SUGGESTIONS};
}

export function setOverSuggestions(boolean) {
  return {type: types.OVER_SUGGESTIONS, hover: boolean};
}

export function searchDocuments(searchTerm) {
  return (dispatch) => {
    return api.search(searchTerm)
    .then((documents) => {
      dispatch(setDocuments(documents));
      dispatch(hideSuggestions());
    });
  };
}

export function getSuggestions(searchTerm) {
  return (dispatch) => {
    return api.getSuggestions(searchTerm)
    .then((suggestions) => {
      dispatch(setSuggestions(suggestions));
      dispatch(showSuggestions());
    });
  };
}
