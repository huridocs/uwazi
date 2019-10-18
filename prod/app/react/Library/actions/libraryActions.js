"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.enterLibrary = enterLibrary;exports.initializeFiltersForm = initializeFiltersForm;exports.selectDocument = selectDocument;exports.getAndSelectDocument = getAndSelectDocument;exports.selectDocuments = selectDocuments;exports.unselectDocument = unselectDocument;exports.selectSingleDocument = selectSingleDocument;exports.unselectAllDocuments = unselectAllDocuments;exports.updateSelectedEntities = updateSelectedEntities;exports.showFilters = showFilters;exports.hideFilters = hideFilters;exports.setDocuments = setDocuments;exports.unsetDocuments = unsetDocuments;exports.setTemplates = setTemplates;exports.setPreviewDoc = setPreviewDoc;exports.setSuggestions = setSuggestions;exports.hideSuggestions = hideSuggestions;exports.showSuggestions = showSuggestions;exports.setOverSuggestions = setOverSuggestions;exports.zoomIn = zoomIn;exports.zoomOut = zoomOut;exports.filterIsEmpty = filterIsEmpty;exports.processFilters = processFilters;exports.encodeSearch = encodeSearch;exports.searchDocuments = searchDocuments;exports.elementCreated = elementCreated;exports.updateEntity = updateEntity;exports.updateEntities = updateEntities;exports.searchSnippets = searchSnippets;exports.saveDocument = saveDocument;exports.multipleUpdate = multipleUpdate;exports.saveEntity = saveEntity;exports.removeDocument = removeDocument;exports.removeDocuments = removeDocuments;exports.deleteDocument = deleteDocument;exports.deleteEntity = deleteEntity;exports.loadMoreDocuments = loadMoreDocuments;exports.getSuggestions = getSuggestions;exports.getDocumentReferences = getDocumentReferences;var types = _interopRequireWildcard(require("./actionTypes"));
var _SearchAPI = _interopRequireDefault(require("../../Search/SearchAPI"));
var _Notifications = require("../../Notifications");
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = require("../../BasicReducer");
var _Documents = require("../../Documents");
var _reactRouter = require("react-router");
var _rison = _interopRequireDefault(require("rison"));
var _referencesAPI = _interopRequireDefault(require("../../Viewer/referencesAPI"));
var _Entities = require("../../Entities");
var _JSONRequest = require("../../../shared/JSONRequest");
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function (obj) {return typeof obj;};} else {_typeof = function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}

function enterLibrary() {
  return { type: types.ENTER_LIBRARY };
}

function initializeFiltersForm(values = {}) {
  return Object.assign(values, { type: types.INITIALIZE_FILTERS_FORM });
}

function selectDocument(doc) {
  return (dispatch, getState) => {
    let document = doc;
    if (doc.toJS) {
      document = doc.toJS();
    }
    if (getState().library.sidepanel.tab === 'semantic-search-results' && !document.semanticSearch) {
      dispatch(_BasicReducer.actions.set('library.sidepanel.tab', ''));
    }
    dispatch({ type: types.SELECT_DOCUMENT, doc: document });
  };
}

function getAndSelectDocument(sharedId) {
  return dispatch => {
    _Entities.api.get(new _RequestParams.RequestParams({ sharedId })).
    then(entity => {
      dispatch({ type: types.SELECT_SINGLE_DOCUMENT, doc: entity[0] });
    });
  };
}

function selectDocuments(docs) {
  return { type: types.SELECT_DOCUMENTS, docs };
}

function unselectDocument(docId) {
  return { type: types.UNSELECT_DOCUMENT, docId };
}

function selectSingleDocument(doc) {
  return { type: types.SELECT_SINGLE_DOCUMENT, doc };
}

function unselectAllDocuments() {
  return { type: types.UNSELECT_ALL_DOCUMENTS };
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

  if (_typeof(value) === 'object') {
    const hasValue = Object.keys(value).reduce((result, key) => result || Boolean(value[key]), false);
    return !hasValue;
  }

  return false;
}

function processFilters(readOnlySearch, filters, limit) {
  const search = Object.assign({ filters: {} }, readOnlySearch);
  search.filters = {};

  filters.properties.forEach(property => {
    if (!filterIsEmpty(readOnlySearch.filters[property.name]) && !property.filters) {
      search.filters[property.name] = readOnlySearch.filters[property.name];
    }

    if (property.filters) {
      const searchFilter = Object.assign({}, readOnlySearch.filters[property.name]);
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
  return search;
}

function encodeSearch(search, appendQ = true) {
  Object.keys(search).forEach(key => {
    if (search[key] && search[key].length === 0) {
      delete search[key];
    }

    if (_typeof(search[key]) === 'object' && Object.keys(search[key]).length === 0) {
      delete search[key];
    }

    if (search[key] === '') {
      delete search[key];
    }
  });

  return appendQ ? `?q=${_rison.default.encode(search)}` : _rison.default.encode(search);
}

function setSearchInUrl(searchParams) {
  const { pathname } = _reactRouter.browserHistory.getCurrentLocation();
  const path = `${pathname}/`.replace(/\/\//g, '/');
  const query = _reactRouter.browserHistory.getCurrentLocation().query || {};

  query.q = encodeSearch(searchParams, false);
  _reactRouter.browserHistory.push(path + (0, _JSONRequest.toUrlParams)(query));
}

function searchDocuments({ search, filters }, storeKey, limit = 30) {
  return (dispatch, getState) => {
    const state = getState()[storeKey];
    let currentFilters = filters || state.filters;
    currentFilters = currentFilters.toJS ? currentFilters.toJS() : currentFilters;

    const finalSearchParams = processFilters(search, currentFilters, limit);
    finalSearchParams.searchTerm = state.search.searchTerm;

    const currentSearchParams = _rison.default.decode(decodeURIComponent(_reactRouter.browserHistory.getCurrentLocation().q || '()'));
    if (finalSearchParams.searchTerm && finalSearchParams.searchTerm !== currentSearchParams.searchTerm) {
      finalSearchParams.sort = '_score';
    }

    if (search.userSelectedSorting) dispatch(_BasicReducer.actions.set(`${storeKey}.selectedSorting`, search));

    setSearchInUrl(finalSearchParams);
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

function searchSnippets(searchTerm, sharedId, storeKey) {
  return dispatch => _SearchAPI.default.searchSnippets(new _RequestParams.RequestParams({ searchTerm, id: sharedId })).
  then(snippets => {
    dispatch(_BasicReducer.actions.set(`${storeKey}.sidepanel.snippets`, snippets));
    return snippets;
  });
}

function saveDocument(doc, formKey) {
  return dispatch => _Documents.documentsApi.save(new _RequestParams.RequestParams(doc)).
  then(updatedDoc => {
    dispatch(_Notifications.notificationActions.notify('Document updated', 'success'));
    dispatch(_reactReduxForm.actions.reset(formKey));
    dispatch(updateEntity(updatedDoc));
    dispatch(_BasicReducer.actions.updateIn('library.markers', ['rows'], updatedDoc));
    dispatch(selectSingleDocument(updatedDoc));
  });
}

function multipleUpdate(entities, values) {
  return dispatch => {
    const updatedEntities = entities.toJS().map(_entity => {
      const entity = _objectSpread({}, _entity);
      entity.metadata = Object.assign({}, entity.metadata, values.metadata);
      if (values.icon) {
        entity.icon = values.icon;
      }
      return entity;
    });

    const ids = updatedEntities.map(entity => entity.sharedId);
    return _Entities.api.multipleUpdate(new _RequestParams.RequestParams({ ids, values })).
    then(() => {
      dispatch(_Notifications.notificationActions.notify('Update success', 'success'));
      dispatch(updateEntities(updatedEntities));
    });
  };
}

function saveEntity(entity, formModel) {
  return dispatch => _Entities.api.save(new _RequestParams.RequestParams(entity)).
  then(updatedDoc => {
    dispatch(_reactReduxForm.actions.reset(formModel));
    dispatch(unselectAllDocuments());
    if (entity._id) {
      dispatch(_Notifications.notificationActions.notify('Entity updated', 'success'));
      dispatch(updateEntity(updatedDoc));
      dispatch(_BasicReducer.actions.updateIn('library.markers', ['rows'], updatedDoc));
    } else {
      dispatch(_Notifications.notificationActions.notify('Entity created', 'success'));
      dispatch(elementCreated(updatedDoc));
    }

    dispatch(selectSingleDocument(updatedDoc));
  });
}

function removeDocument(doc) {
  return { type: types.REMOVE_DOCUMENT, doc };
}

function removeDocuments(docs) {
  return { type: types.REMOVE_DOCUMENTS, docs };
}

function deleteDocument(doc) {
  return dispatch => _Documents.documentsApi.delete(new _RequestParams.RequestParams({ sharedId: doc.sharedId })).
  then(() => {
    dispatch(_Notifications.notificationActions.notify('Document deleted', 'success'));
    dispatch(unselectAllDocuments());
    dispatch(removeDocument(doc));
  });
}

function deleteEntity(entity) {
  return dispatch => _Entities.api.delete(entity).
  then(() => {
    dispatch(_Notifications.notificationActions.notify('Entity deleted', 'success'));
    dispatch(unselectDocument(entity._id));
    dispatch(removeDocument(entity));
  });
}

function loadMoreDocuments(storeKey, amount) {
  return (dispatch, getState) => {
    searchDocuments({ search: getState()[storeKey].search }, storeKey, amount)(dispatch, getState);
  };
}

function getSuggestions() {
  return { type: 'GET_SUGGESTIONS' };
}

function getDocumentReferences(sharedId, storeKey) {
  return dispatch => _referencesAPI.default.get(new _RequestParams.RequestParams({ sharedId })).
  then(references => {
    dispatch(_BasicReducer.actions.set(`${storeKey}.sidepanel.references`, references));
  });
}