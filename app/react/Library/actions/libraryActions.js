import * as types from 'app/Library/actions/actionTypes';
import api from 'app/Search/SearchAPI';
import {notify} from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';
import documents from 'app/Documents';
import entities from 'app/Entities';
import {browserHistory} from 'react-router';
import {toUrlParams} from 'shared/JSONRequest';

export function enterLibrary() {
  return {type: types.ENTER_LIBRARY};
}

export function selectDocument(doc) {
  return {
    type: types.SELECT_DOCUMENT,
    doc
  };
}
export function unselectDocument() {
  return {type: types.UNSELECT_DOCUMENT};
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

export function searchDocuments(readOnlySearch, limit) {
  return function (dispatch, getState) {
    const filters = getState().library.filters.toJS();
    const search = Object.assign({}, readOnlySearch);
    search.aggregations = filters.properties
    .filter((property) => property.type === 'select' || property.type === 'multiselect' || property.type === 'nested')
    .map((property) => {
      if (property.type === 'nested') {
        return {name: property.name, nested: true, nestedProperties: property.nestedProperties};
      }
      return {name: property.name, nested: false};
    });

    search.filters = {};
    filters.properties.forEach((property) => {
      if (!property.active) {
        return;
      }
      let type = 'text';
      if (property.type === 'date' || property.type === 'multidate') {
        type = 'range';
      }
      if (property.type === 'select' || property.type === 'multiselect') {
        type = 'multiselect';
      }
      if (property.type === 'nested') {
        type = 'nested';
      }
      if (property.type === 'multidaterange') {
        type = 'nestedrange';
      }
      search.filters[property.name] = {value: readOnlySearch.filters[property.name], type};
    });
    search.types = filters.documentTypes;
    search.limit = limit;
    dispatch(hideSuggestions());
    browserHistory.push(`/library/${toUrlParams(search)}`);
  };
}

export function saveDocument(doc) {
  return function (dispatch) {
    return documents.api.save(doc)
    .then((updatedDoc) => {
      dispatch(notify('Document updated', 'success'));
      dispatch(formActions.reset('library.metadata'));
      dispatch({type: types.UPDATE_DOCUMENT, doc: updatedDoc});
      dispatch(selectDocument(updatedDoc));
    });
  };
}

export function saveEntity(entity) {
  return function (dispatch) {
    return entities.api.save(entity)
    .then((updatedDoc) => {
      dispatch(notify('Entity updated', 'success'));
      dispatch(formActions.reset('library.metadata'));
      dispatch({type: types.UPDATE_DOCUMENT, doc: updatedDoc});
      dispatch(selectDocument(updatedDoc));
    });
  };
}

export function removeDocument(doc) {
  return {type: types.REMOVE_DOCUMENT, doc};
}

export function deleteDocument(doc) {
  return function (dispatch) {
    return documents.api.delete(doc)
    .then(() => {
      dispatch(notify('Document deleted', 'success'));
      dispatch(unselectDocument());
      dispatch(removeDocument(doc));
    });
  };
}

export function deleteEntity(entity) {
  return function (dispatch) {
    return entities.api.delete(entity)
    .then(() => {
      dispatch(notify('Entity deleted', 'success'));
      dispatch(unselectDocument());
      dispatch(removeDocument(entity));
    });
  };
}

export function loadMoreDocuments(amount) {
  return function (dispatch, getState) {
    searchDocuments(getState().search, amount)(dispatch, getState);
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
