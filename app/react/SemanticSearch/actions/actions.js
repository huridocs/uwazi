import Immutable from 'immutable';
import { actions } from 'app/BasicReducer';

import api from '../SemanticSearchAPI';

export function fetchSearches() {
  return dispatch => api.getAllSearches()
  .then((response) => {
    dispatch(actions.set('semanticSearch/searches', response));
  });
}

export function selectSemanticSearchDocument(doc) {
  return (dispatch) => {
    dispatch(actions.set('semanticSearch/selectedDocument', doc));
    dispatch(actions.set('library.sidepanel.tab', 'semantic-search-results'));
  };
}

export function unselectSemanticSearchDocument() {
  return (dispatch) => {
    dispatch(actions.set('semanticSearch/selectedDocument', {}));
  };
}

export function submitNewSearch(args) {
  return dispatch => api.search(args)
  .then(() => {
    dispatch(fetchSearches());
  });
}

export function showSemanticSearch() {
  return (dispatch) => {
    dispatch(actions.set('semanticSearch/showSemanticSearchPanel', true));
  };
}

export function hideSemanticSearch() {
  return (dispatch) => {
    dispatch(actions.set('semanticSearch/showSemanticSearchPanel', false));
  };
}

export function deleteSearch(searchId) {
  return dispatch => api.deleteSearch(searchId)
  .then(() => {
    dispatch(fetchSearches());
  });
}

export function stopSearch(searchId) {
  return dispatch => api.stopSearch(searchId)
  .then(() => {
    dispatch(fetchSearches());
  });
}

export function resumeSearch(searchId) {
  return dispatch => api.resumeSearch(searchId)
  .then(() => {
    dispatch(fetchSearches());
  });
}

export function registerForUpdates() {
  return () => api.registerForUpdates();
}

export function updateSearch(updatedSearch) {
  return dispatch => dispatch(actions.update('semanticSearch/searches', updatedSearch));
}

export function addSearchResults(newDocs) {
  return (dispatch, getState) => {
    const currentSearch = getState().semanticSearch.search;
    console.log('current results', currentSearch.toJS().results);
    const newResults = currentSearch.update('results', existingDocs =>
      newDocs.reduce((updatedDocs, newDoc) => {
        if (!updatedDocs.find(d => newDoc._id === d.get('_id'))) {
          return updatedDocs.push(Immutable.fromJS(newDoc));
        }
        return updatedDocs;
      }, existingDocs)
    );
    console.log('new results', newResults);
    dispatch(actions.set('semanticSearch/search', newResults));
  };
}
