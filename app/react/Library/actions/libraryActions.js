/* eslint-disable max-lines */
import qs from 'qs';
import rison from 'rison-node';
import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import { store } from 'app/store';
import * as types from 'app/Library/actions/actionTypes';
import { actions } from 'app/BasicReducer';
import { documentsApi } from 'app/Documents';
import { api as entitiesAPI } from 'app/Entities';
import { notificationActions } from 'app/Notifications';
import { RequestParams } from 'app/utils/RequestParams';
import searchAPI from 'app/Search/SearchAPI';
import referencesAPI from 'app/Viewer/referencesAPI';
import { searchParamsFromLocationSearch } from 'app/utils/routeHelpers';
import { toUrlParams } from 'shared/JSONRequest';
import { selectedDocumentsChanged, maybeSaveQuickLabels } from './quickLabelActions';
import { filterToQuery } from '../helpers/publishedStatusFilter';
import { saveEntityWithFiles } from './saveEntityWithFiles';
import { isArray } from 'lodash';

function enterLibrary() {
  return { type: types.ENTER_LIBRARY };
}

function initializeFiltersForm(values = {}) {
  return Object.assign(values, { type: types.INITIALIZE_FILTERS_FORM });
}

function selectDocument(_doc) {
  return async (dispatch, getState) => {
    const doc = _doc.toJS ? _doc.toJS() : _doc;
    const showingSemanticSearch = getState().library.sidepanel.tab === 'semantic-search-results';
    if (showingSemanticSearch && !doc.semanticSearch) {
      dispatch(actions.set('library.sidepanel.tab', ''));
    }
    dispatch(actions.set('library.sidepanel.view', 'library'));
    await dispatch(maybeSaveQuickLabels());
    dispatch({ type: types.SELECT_DOCUMENT, doc });
    dispatch(selectedDocumentsChanged());
  };
}

function getAndSelectDocument(sharedId) {
  return dispatch => {
    entitiesAPI.get(new RequestParams({ sharedId })).then(entity => {
      dispatch({ type: types.SELECT_SINGLE_DOCUMENT, doc: entity[0] });
    });
  };
}

function selectDocuments(docs) {
  return async dispatch => {
    await dispatch(maybeSaveQuickLabels());
    dispatch({ type: types.SELECT_DOCUMENTS, docs });
    dispatch(selectedDocumentsChanged());
  };
}

function unselectDocument(docId) {
  return async dispatch => {
    await dispatch(maybeSaveQuickLabels());
    dispatch({ type: types.UNSELECT_DOCUMENT, docId });
    dispatch(selectedDocumentsChanged());
  };
}

function selectSingleDocument(doc) {
  return async dispatch => {
    await dispatch(maybeSaveQuickLabels());
    dispatch({ type: types.SELECT_SINGLE_DOCUMENT, doc });
    dispatch(selectedDocumentsChanged());
  };
}

function unselectAllDocuments() {
  return async dispatch => {
    await dispatch(maybeSaveQuickLabels());
    dispatch({ type: types.UNSELECT_ALL_DOCUMENTS });
    dispatch(selectedDocumentsChanged());
  };
}

function updateSelectedEntities(entities) {
  return { type: types.UPDATE_SELECTED_ENTITIES, entities };
}

function showFilters() {
  return { type: types.SHOW_FILTERS };
}

function hideFilters() {
  return { type: types.HIDE_FILTERS };
}

function setDocuments(docs) {
  return { type: types.SET_DOCUMENTS, documents: docs };
}

function addDocuments(docs) {
  return { type: types.ADD_DOCUMENTS, documents: docs };
}

function unsetDocuments() {
  return { type: types.UNSET_DOCUMENTS };
}

function setTemplates(templates, thesauris) {
  return dispatch => {
    dispatch({ type: types.SET_LIBRARY_TEMPLATES, templates, thesauris });
  };
}

function setPreviewDoc(docId) {
  return { type: types.SET_PREVIEW_DOC, docId };
}

function setSuggestions(suggestions) {
  return { type: types.SET_SUGGESTIONS, suggestions };
}

function hideSuggestions() {
  return { type: types.HIDE_SUGGESTIONS };
}

function showSuggestions() {
  return { type: types.SHOW_SUGGESTIONS };
}

function setOverSuggestions(boolean) {
  return { type: types.OVER_SUGGESTIONS, hover: boolean };
}

function zoomIn() {
  return { type: types.ZOOM_IN };
}

function zoomOut() {
  return { type: types.ZOOM_OUT };
}

function filterIsEmpty(value) {
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
    const hasValue = Object.keys(value).reduce(
      (result, key) => result || Boolean(value[key]),
      false
    );
    return !hasValue;
  }

  return false;
}

function processFilters(readOnlySearch, filters, limit, from) {
  let search = {
    filters: {},
    ...readOnlySearch,
  };

  if (search.publishedStatus) {
    search = filterToQuery(search);
  }

  search.filters = {};

  filters.properties.forEach(property => {
    if (!filterIsEmpty(readOnlySearch.filters[property.name]) && !property.filters) {
      if (!isArray(readOnlySearch.filters[property.name])) {
        search.filters[property.name] = encodeURIComponent(
          readOnlySearch.filters[property.name]
        ).replace(/%20/g, ' ');
      }
      search.filters[property.name] = readOnlySearch.filters[property.name];
    }

    if (property.filters) {
      const searchFilter = { ...readOnlySearch.filters[property.name] };
      property.filters.forEach(filter => {
        if (filterIsEmpty(searchFilter[filter.name])) {
          delete searchFilter[filter.name];
        }
      });

      if (Object.keys(searchFilter).length) {
        search.filters[property.name] = searchFilter;
      }
    }
  });

  search.types = filters.documentTypes;
  search.limit = limit;
  search.from = from;
  return search;
}

function encodeSearch(_search, appendQ = true) {
  const search = { ..._search };
  Object.keys(search).forEach(key => {
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

  if (search.searchTerm) {
    search.searchTerm = `${encodeURIComponent(search.searchTerm).replace(/%20/g, ' ')}:`;
  }

  const encodedSearch = rison.encode(search).replace(/searchTerm:'([^:]+):'/, "searchTerm:'$1'");
  return appendQ ? `?q=${encodedSearch}` : encodedSearch;
}

function setSearchInUrl(searchParams, location, navigate) {
  const { pathname } = location;
  const path = `${pathname}/`.replace(/\/\//g, '/');
  const query = new URLSearchParams(location.search);

  query.q = encodeSearch(searchParams, false);

  return navigate(path + toUrlParams(query));
}

function searchDocuments(
  { search = undefined, location, navigate, filters = undefined },
  limit = 30,
  from = 0
) {
  return (dispatch, getState) => {
    const state = getState().library;
    const currentSearch = search || state.search;
    const currentFilters = filters || state.filters;
    const currentSearchParams = searchParamsFromLocationSearch(location);

    const searchParams = {
      ...processFilters(
        currentSearch,
        currentFilters.toJS ? currentFilters.toJS() : currentFilters,
        limit,
        from
      ),
      searchTerm: state.search.searchTerm,
      customFilters: currentSearch.customFilters,
    };

    if (searchParams.searchTerm && searchParams.searchTerm !== currentSearchParams.searchTerm) {
      searchParams.sort = '_score';
    }

    if (currentSearch.userSelectedSorting) {
      dispatch(actions.set('library.selectedSorting', currentSearch));
    }

    return setSearchInUrl(searchParams, location, navigate);
  };
}

function elementCreated(doc) {
  return { type: types.ELEMENT_CREATED, doc };
}

function updateEntity(updatedDoc) {
  return { type: types.UPDATE_DOCUMENT, doc: updatedDoc };
}

function updateEntities(updatedDocs) {
  return { type: types.UPDATE_DOCUMENTS, docs: updatedDocs };
}

function searchSnippets(searchString, sharedId, storeKey) {
  const requestParams = new RequestParams(
    qs.stringify({
      filter: { sharedId, searchString },
      fields: ['snippets'],
    })
  );

  return dispatch =>
    searchAPI.searchSnippets(requestParams).then(({ data }) => {
      const snippets = data.length ? data[0].snippets : { total: 0, fullText: [], metadata: [] };
      dispatch(actions.set(`${storeKey}.sidepanel.snippets`, snippets));
      return snippets;
    });
}

function saveDocument(doc, formKey) {
  return async dispatch => {
    const updatedDoc = await documentsApi.save(new RequestParams(doc));
    dispatch(notificationActions.notify(t('System', 'Entity updated', null, false), 'success'));
    dispatch(formActions.reset(formKey));
    dispatch(updateEntity(updatedDoc));
    dispatch(actions.updateIn('library.markers', ['rows'], updatedDoc));
    await dispatch(selectSingleDocument(updatedDoc));
  };
}

function multipleUpdate(entities, values) {
  return async dispatch => {
    const ids = entities.map(entity => entity.get('sharedId')).toJS();
    const updatedDocs = await entitiesAPI.multipleUpdate(new RequestParams({ ids, values }));
    dispatch(notificationActions.notify(t('System', 'Update success', null, false), 'success'));
    dispatch(updateEntities(updatedDocs));
  };
}

//
function saveEntity(entity, formModel) {
  // eslint-disable-next-line max-statements
  return async dispatch => {
    const { entity: updatedDoc, errors } = await saveEntityWithFiles(entity, dispatch);
    let message = '';

    dispatch(formActions.reset(formModel));
    await dispatch(unselectAllDocuments());
    if (entity._id) {
      message = 'Entity updated';
      dispatch(updateEntity(updatedDoc));
      dispatch(actions.updateIn('library.markers', ['rows'], updatedDoc));
    } else {
      message = 'Entity created';
      dispatch(elementCreated(updatedDoc));
    }
    if (errors.length) {
      message = `${message} with the following errors: ${JSON.stringify(errors, null, 2)}`;
    }
    const notificationMessage = t('System', message, null, false);
    await dispatch(
      notificationActions.notify(notificationMessage, errors.length ? 'warning' : 'success')
    );
    await dispatch(selectSingleDocument(updatedDoc));
  };
}

function removeDocument(doc) {
  return { type: types.REMOVE_DOCUMENT, doc };
}

function removeDocuments(docs) {
  return { type: types.REMOVE_DOCUMENTS, docs };
}

function deleteDocument(doc) {
  return async dispatch => {
    await documentsApi.delete(new RequestParams({ sharedId: doc.sharedId }));
    dispatch(notificationActions.notify(t('System', 'Entity deleted', null, false), 'success'));
    await dispatch(unselectAllDocuments());
    dispatch(removeDocument(doc));
  };
}

function deleteEntity(entity) {
  return async dispatch => {
    await entitiesAPI.delete(entity);
    dispatch(notificationActions.notify(t('System', 'Entity deleted', null, false), 'success'));
    await dispatch(unselectDocument(entity._id));
    dispatch(removeDocument(entity));
  };
}

function loadMoreDocuments(amount, from, location, navigate) {
  return (dispatch, getState) => {
    const { search } = getState().library;
    searchDocuments({ search, location, navigate }, amount, from)(dispatch, getState);
  };
}

function getSuggestions() {
  return { type: 'GET_SUGGESTIONS' };
}

function getDocumentReferences(sharedId, fileId, storeKey) {
  return dispatch =>
    referencesAPI
      .get(new RequestParams({ sharedId, file: fileId, onlyTextReferences: true }))
      .then(references => {
        dispatch(actions.set(`${storeKey}.sidepanel.references`, references));
        dispatch(actions.set('relationships/list/sharedId', sharedId));
      });
}

function getAggregationSuggestions(storeKey, property, searchTerm) {
  const state = store.getState()[storeKey];
  const { search, filters } = state;

  const query = processFilters(search, filters.toJS(), 0);
  query.searchTerm = search.searchTerm;
  if (storeKey === 'uploads') {
    query.unpublished = true;
  }
  return searchAPI.getAggregationSuggestions(new RequestParams({ query, property, searchTerm }));
}

function setTableViewColumns(columns) {
  return { type: types.SET_TABLE_VIEW_COLUMNS, columns };
}

function setTableViewColumnHidden(name, hidden) {
  return {
    type: types.SET_TABLE_VIEW_COLUMN_HIDDEN,
    name,
    hidden,
  };
}

function setTableViewAllColumnsHidden(hidden) {
  return {
    type: types.SET_TABLE_VIEW_ALL_COLUMNS_HIDDEN,
    hidden,
  };
}

export {
  enterLibrary,
  initializeFiltersForm,
  selectDocument,
  getAndSelectDocument,
  selectDocuments,
  unselectDocument,
  selectSingleDocument,
  unselectAllDocuments,
  updateSelectedEntities,
  showFilters,
  hideFilters,
  setDocuments,
  addDocuments,
  unsetDocuments,
  setTemplates,
  setPreviewDoc,
  setSuggestions,
  hideSuggestions,
  showSuggestions,
  setOverSuggestions,
  zoomIn,
  zoomOut,
  filterIsEmpty,
  processFilters,
  encodeSearch,
  searchDocuments,
  elementCreated,
  updateEntity,
  updateEntities,
  searchSnippets,
  saveDocument,
  multipleUpdate,
  saveEntity,
  removeDocument,
  removeDocuments,
  deleteDocument,
  deleteEntity,
  loadMoreDocuments,
  getSuggestions,
  getDocumentReferences,
  getAggregationSuggestions,
  setTableViewAllColumnsHidden,
  setTableViewColumnHidden,
  setTableViewColumns,
};
