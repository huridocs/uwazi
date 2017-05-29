import * as types from 'app/Library/actions/actionTypes';
import api from 'app/Search/SearchAPI';
import {notify} from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import documents from 'app/Documents';
import {browserHistory} from 'react-router';
import rison from 'rison';
import referencesAPI from 'app/Viewer/referencesAPI';
import {api as entitiesAPI} from 'app/Entities';
import referencesUtils from 'app/Viewer/utils/referencesUtils';

export function enterLibrary() {
  return {type: types.ENTER_LIBRARY};
}

export function selectDocument(doc) {
  let document = doc;
  if (doc.toJS) {
    document = doc.toJS();
  }
  return {type: types.SELECT_DOCUMENT, doc: document};
}

export function selectDocuments(docs) {
  return {type: types.SELECT_DOCUMENTS, docs};
}

export function unselectDocument(docId) {
  return {type: types.UNSELECT_DOCUMENT, docId};
}

export function selectSingleDocument(doc) {
  return {type: types.SELECT_SINGLE_DOCUMENT, doc};
}

export function unselectAllDocuments() {
  return {type: types.UNSELECT_ALL_DOCUMENTS};
}

export function updateSelectedEntities(entities) {
  return {type: types.UPDATE_SELECTED_ENTITIES, entities};
}

export function showFilters() {
  return {type: types.SHOW_FILTERS};
}

export function hideFilters() {
  return {type: types.HIDE_FILTERS};
}

export function setDocuments(docs) {
  return {type: types.SET_DOCUMENTS, documents: docs};
}

export function setTemplates(templates, thesauris) {
  return function (dispatch) {
    dispatch({type: types.SET_LIBRARY_TEMPLATES, templates, thesauris});
  };
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

export function processFilters(readOnlySearch, filters, limit) {
  const search = Object.assign({filters: {}}, readOnlySearch);
  search.filters = {};
  filters.properties.forEach((property) => {
    if (property.active) {
      search.filters[property.name] = readOnlySearch.filters[property.name];
    }
  });
  search.types = filters.documentTypes;
  search.limit = limit;
  return search;
}

export function encodeSearch(search) {
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
  return '?q=' + rison.encode(search);
}

export function searchDocuments(readOnlySearch, storeKey, limit) {
  return function (dispatch, getState) {
    const filters = getState()[storeKey].filters.toJS();
    const search = processFilters(readOnlySearch, filters, limit);
    dispatch(hideSuggestions());

    if (readOnlySearch.userSelectedSorting) {
      dispatch(actions.set(storeKey + '.selectedSorting', readOnlySearch));
    }

    const pathname = browserHistory.getCurrentLocation().pathname;
    const path = (pathname + '/').replace(/\/\//g, '/');
    browserHistory.push(path + encodeSearch(search));
  };
}

export function elementCreated(doc) {
  return {type: types.ELEMENT_CREATED, doc};
}

export function updateEntity(updatedDoc) {
  return {type: types.UPDATE_DOCUMENT, doc: updatedDoc};
}

export function updateEntities(updatedDocs) {
  return {type: types.UPDATE_DOCUMENTS, docs: updatedDocs};
}

export function saveDocument(doc, formKey) {
  return function (dispatch) {
    return documents.api.save(doc)
    .then((updatedDoc) => {
      dispatch(notify('Document updated', 'success'));
      dispatch(formActions.reset(formKey));
      dispatch(updateEntity(updatedDoc));
      dispatch(selectDocument(updatedDoc));
    });
  };
}

export function multipleUpdate(entities, values) {
  return function (dispatch) {
    const updatedEntities = entities.toJS().map((entity) => {
      entity.metadata = Object.assign({}, entity.metadata, values.metadata);
      if (values.icon) {
        entity.icon = values.icon;
      }
      return entity;
    });

    const updatedEntitiesIds = updatedEntities.map((entity) => entity.sharedId);
    return entitiesAPI.multipleUpdate(updatedEntitiesIds, values)
    .then(() => {
      dispatch(notify('Update success', 'success'));
      dispatch(updateEntities(updatedEntities));
    });
  };
}

export function saveEntity(entity, formModel) {
  return function (dispatch) {
    return entitiesAPI.save(entity)
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

      dispatch(selectDocument(updatedDoc));
    });
  };
}

export function removeDocument(doc) {
  return {type: types.REMOVE_DOCUMENT, doc};
}

export function removeDocuments(docs) {
  return {type: types.REMOVE_DOCUMENTS, docs};
}

export function deleteDocument(doc) {
  return function (dispatch) {
    return documents.api.delete(doc)
    .then(() => {
      dispatch(notify('Document deleted', 'success'));
      dispatch(unselectAllDocuments());
      dispatch(removeDocument(doc));
    });
  };
}

export function deleteEntity(entity) {
  return function (dispatch) {
    return entitiesAPI.delete(entity)
    .then(() => {
      dispatch(notify('Entity deleted', 'success'));
      dispatch(unselectDocument(entity._id));
      dispatch(removeDocument(entity));
    });
  };
}

export function loadMoreDocuments(storeKey, amount) {
  return function (dispatch, getState) {
    searchDocuments(getState()[storeKey].search, storeKey, amount)(dispatch, getState);
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

export function getDocumentReferences(documentId, storeKey) {
  return (dispatch, getState) => {
    return referencesAPI.get(documentId)
    .then((references) => {
      dispatch(actions.set(storeKey + '.sidepanel.references', referencesUtils.filterRelevant(references, getState().locale)));
    });
  };
}
