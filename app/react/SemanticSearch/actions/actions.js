import Immutable from 'immutable';
import { actions } from 'app/BasicReducer';

import api from '../SemanticSearchAPI';

export function fetchSearches() {
  return dispatch => api.getAllSearches()
  .then((response) => {
    dispatch(actions.set('semanticSearch/searches', response));
  });
}

export function setEditSearchEntities(entities = []) {
  return (dispatch) => {
    dispatch(actions.set('semanticSearch/multiedit', entities));
  };
}

export function editSearchEntities(searchId, args) {
  return dispatch => api.getEntitiesMatchingFilters(searchId, args)
  .then((response) => {
    dispatch(setEditSearchEntities(response));
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

function sanitizeSearchFilters(filters) {
  return Object.keys(filters)
  .reduce((partial, key) => {
    const emptyFilter = !filters[key] || typeof filters[key] === 'object' && !Object.keys(filters[key]).length;
    if (emptyFilter) {
      return partial;
    }
    return { ...partial, [key]: filters[key] };
  }, {});
}

export function submitNewSearch(args) {
  const { searchTerm } = args;
  const query = Object.assign({}, args, { searchTerm: '' }, { filters: sanitizeSearchFilters(args.filters) });
  const search = Object.assign({ searchTerm, query });

  return dispatch => api.search(search)
  .then(() => dispatch(fetchSearches()));
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
    const newResults = currentSearch.update('results', existingDocs => newDocs
    .reduce((updatedDocs, newDoc) => {
      if (!updatedDocs.find(d => newDoc._id === d.get('_id'))) {
        return updatedDocs.push(Immutable.fromJS(newDoc));
      }
      return updatedDocs;
    }, existingDocs));
    dispatch(actions.set('semanticSearch/search', newResults));
  };
}

export function getSearch(searchId, args) {
  return (dispatch, getState) => api.getSearch(searchId, args)
  .then((search) => {
    dispatch(actions.set('semanticSearch/search', search));
    const selectedDoc = getState().semanticSearch.selectedDocument;
    if (selectedDoc) {
      const updatedDoc = search.results.find(doc => doc.sharedId === selectedDoc.get('sharedId'));
      if (updatedDoc) {
        dispatch(actions.set('semanticSearch/selectedDocument', updatedDoc));
      }
    }
  });
}

export function getMoreSearchResults(searchId, args) {
  return dispatch => api.getSearch(searchId, args)
  .then(search =>
    dispatch(actions.concatIn('semanticSearch/search', ['results'], search.results))
  );
}
