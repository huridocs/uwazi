import * as types from 'app/Library/actions/actionTypes';
import api from 'app/Search/SearchAPI';
import { notify } from 'app/Notifications';
import { actions as formActions } from 'react-redux-form';
import { actions } from 'app/BasicReducer';
import documents from 'app/Documents';
import { browserHistory } from 'react-router';
import rison from 'rison';
import referencesAPI from 'app/Viewer/referencesAPI';
import { api as entitiesAPI } from 'app/Entities';
import { toUrlParams } from 'shared/JSONRequest';

export function enterLibrary() {
  return { type: types.ENTER_LIBRARY };
}

export function initializeFiltersForm(values = {}) {
  return Object.assign(values, { type: types.INITIALIZE_FILTERS_FORM });
}

export function selectDocument(doc) {
  let document = doc;
  if (doc.toJS) {
    document = doc.toJS();
  }
  return { type: types.SELECT_DOCUMENT, doc: document };
}

export function getAndSelectDocument(id) {
  return (dispatch) => {
    entitiesAPI.get(id)
    .then((entity) => {
      dispatch({ type: types.SELECT_SINGLE_DOCUMENT, doc: entity[0] });
    });
  };
}

export function selectDocuments(docs) {
  return { type: types.SELECT_DOCUMENTS, docs };
}

export function unselectDocument(docId) {
  return { type: types.UNSELECT_DOCUMENT, docId };
}

export function selectSingleDocument(doc) {
  return { type: types.SELECT_SINGLE_DOCUMENT, doc };
}

export function unselectAllDocuments() {
  return { type: types.UNSELECT_ALL_DOCUMENTS };
}

export function updateSelectedEntities(entities) {
  return { type: types.UPDATE_SELECTED_ENTITIES, entities };
}

export function showFilters() {
  return { type: types.SHOW_FILTERS };
}

export function hideFilters() {
  return { type: types.HIDE_FILTERS };
}

export function setDocuments(docs) {
  return { type: types.SET_DOCUMENTS, documents: docs };
}

export function unsetDocuments() {
  return { type: types.UNSET_DOCUMENTS };
}

export function setTemplates(templates, thesauris) {
  return (dispatch) => {
    dispatch({ type: types.SET_LIBRARY_TEMPLATES, templates, thesauris });
  };
}

export function setPreviewDoc(docId) {
  return { type: types.SET_PREVIEW_DOC, docId };
}

export function setSuggestions(suggestions) {
  return { type: types.SET_SUGGESTIONS, suggestions };
}

export function hideSuggestions() {
  return { type: types.HIDE_SUGGESTIONS };
}

export function showSuggestions() {
  return { type: types.SHOW_SUGGESTIONS };
}

export function setOverSuggestions(boolean) {
  return { type: types.OVER_SUGGESTIONS, hover: boolean };
}

export function filterIsEmpty(value) {
  if (value && value.values && !value.values.length) {
    return true;
  }

  if (Array.isArray(value) && !value.length) {
    return true;
  }

  if (typeof value === 'string' && !value) {
    return true;
  }

  if (typeof value === 'object') {
    const hasValue = Object.keys(value).reduce((result, key) => result || Boolean(value[key]), false);
    return !hasValue;
  }

  return false;
}

export function processFilters(readOnlySearch, filters, limit) {
  const search = Object.assign({ filters: {} }, readOnlySearch);
  search.filters = {};

  filters.properties.forEach((property) => {
    if (!filterIsEmpty(readOnlySearch.filters[property.name])) {
      search.filters[property.name] = readOnlySearch.filters[property.name];
    }
  });

  search.types = filters.documentTypes;
  search.limit = limit;
  return search;
}

export function encodeSearch(search, appendQ = true) {
  Object.keys(search).forEach((key) => {
    if (search[key] && search[key].length === 0) {
      delete search[key];
    }

    if (typeof search[key] === 'object' && Object.keys(search[key]).length === 0) {
      delete search[key];
    }

    if (search[key] === '') {
      delete search[key];
    }
  });

  return appendQ ? `?q=${rison.encode(search)}` : rison.encode(search);
}

export function searchDocuments({ search, filters }, storeKey, limit) {
  return (dispatch, getState) => {
    const state = getState()[storeKey];
    let currentFilters;
    if (filters) {
      currentFilters = filters;
    }
    if (filters && filters.toJS) {
      currentFilters = filters.toJS();
    }
    if (!currentFilters) {
      currentFilters = state.filters.toJS();
    }

    const finalSearchParams = processFilters(search, currentFilters, limit);
    finalSearchParams.searchTerm = state.search.searchTerm;


    const currentSearch = browserHistory.getCurrentLocation().q || '()';
    const currentSearchParams = rison.decode(decodeURIComponent(currentSearch));
    if (finalSearchParams.searchTerm && finalSearchParams.searchTerm !== currentSearchParams.searchTerm) {
      finalSearchParams.sort = '_score';
    }

    if (search.userSelectedSorting) {
      dispatch(actions.set(`${storeKey}.selectedSorting`, search));
    }

    const { pathname } = browserHistory.getCurrentLocation();
    const path = (`${pathname}/`).replace(/\/\//g, '/');
    const query = browserHistory.getCurrentLocation().query || {};

    query.q = encodeSearch(finalSearchParams, false);
    browserHistory.push(path + toUrlParams(query));
  };
}

export function elementCreated(doc) {
  return { type: types.ELEMENT_CREATED, doc };
}

export function updateEntity(updatedDoc) {
  return { type: types.UPDATE_DOCUMENT, doc: updatedDoc };
}

export function updateEntities(updatedDocs) {
  return { type: types.UPDATE_DOCUMENTS, docs: updatedDocs };
}

export function searchSnippets(searchTerm, sharedId, storeKey) {
  return dispatch => api.searchSnippets(searchTerm, sharedId)
  .then((snippets) => {
    dispatch(actions.set(`${storeKey}.sidepanel.snippets`, snippets));
    return snippets;
  });
}

export function saveDocument(doc, formKey) {
  return dispatch => documents.api.save(doc)
  .then((updatedDoc) => {
    dispatch(notify('Document updated', 'success'));
    dispatch(formActions.reset(formKey));
    dispatch(updateEntity(updatedDoc));
    dispatch(selectSingleDocument(updatedDoc));
  });
}

export function multipleUpdate(entities, values) {
  return (dispatch) => {
    const updatedEntities = entities.toJS().map((entity) => {
      entity.metadata = Object.assign({}, entity.metadata, values.metadata);
      if (values.icon) {
        entity.icon = values.icon;
      }
      return entity;
    });

    const updatedEntitiesIds = updatedEntities.map(entity => entity.sharedId);
    return entitiesAPI.multipleUpdate(updatedEntitiesIds, values)
    .then(() => {
      dispatch(notify('Update success', 'success'));
      dispatch(updateEntities(updatedEntities));
    });
  };
}

export function saveEntity(entity, formModel) {
  return dispatch => entitiesAPI.save(entity)
  .then((updatedDoc) => {
    dispatch(formActions.reset(formModel));
    dispatch(unselectAllDocuments());
    if (entity._id) {
      dispatch(notify('Entity updated', 'success'));
      dispatch(updateEntity(updatedDoc));
    } else {
      dispatch(notify('Entity created', 'success'));
      dispatch(elementCreated(updatedDoc));
    }

    dispatch(selectSingleDocument(updatedDoc));
  });
}

export function removeDocument(doc) {
  return { type: types.REMOVE_DOCUMENT, doc };
}

export function removeDocuments(docs) {
  return { type: types.REMOVE_DOCUMENTS, docs };
}

export function deleteDocument(doc) {
  return dispatch => documents.api.delete(doc)
  .then(() => {
    dispatch(notify('Document deleted', 'success'));
    dispatch(unselectAllDocuments());
    dispatch(removeDocument(doc));
  });
}

export function deleteEntity(entity) {
  return dispatch => entitiesAPI.delete(entity)
  .then(() => {
    dispatch(notify('Entity deleted', 'success'));
    dispatch(unselectDocument(entity._id));
    dispatch(removeDocument(entity));
  });
}

export function loadMoreDocuments(storeKey, amount) {
  return (dispatch, getState) => {
    searchDocuments({ search: getState()[storeKey].search }, storeKey, amount)(dispatch, getState);
  };
}

export function getSuggestions() {
  return { type: 'GET_SUGGESTIONS' };
}

export function getDocumentReferences(documentId, storeKey) {
  return dispatch => referencesAPI.get(documentId)
  .then((references) => {
    dispatch(actions.set(`${storeKey}.sidepanel.references`, references));
  });
}
