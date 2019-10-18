"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.fetchSearches = fetchSearches;exports.setEditSearchEntities = setEditSearchEntities;exports.editSearchEntities = editSearchEntities;exports.selectSemanticSearchDocument = selectSemanticSearchDocument;exports.unselectSemanticSearchDocument = unselectSemanticSearchDocument;exports.submitNewSearch = submitNewSearch;exports.showSemanticSearch = showSemanticSearch;exports.hideSemanticSearch = hideSemanticSearch;exports.deleteSearch = deleteSearch;exports.stopSearch = stopSearch;exports.resumeSearch = resumeSearch;exports.registerForUpdates = registerForUpdates;exports.updateSearch = updateSearch;exports.addSearchResults = addSearchResults;exports.getSearch = getSearch;exports.getMoreSearchResults = getMoreSearchResults;var _immutable = _interopRequireDefault(require("immutable"));
var _BasicReducer = require("../../BasicReducer");
var _RequestParams = require("../../utils/RequestParams");

var _SemanticSearchAPI = _interopRequireDefault(require("../SemanticSearchAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function (obj) {return typeof obj;};} else {_typeof = function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function fetchSearches() {
  return dispatch => _SemanticSearchAPI.default.getAllSearches().
  then(response => {
    dispatch(_BasicReducer.actions.set('semanticSearch/searches', response));
  });
}

function setEditSearchEntities(entities = []) {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('semanticSearch/multiedit', entities));
  };
}

function editSearchEntities(searchId, args) {
  const requestParams = new _RequestParams.RequestParams(_objectSpread({ searchId }, args));
  return dispatch => _SemanticSearchAPI.default.getEntitiesMatchingFilters(requestParams).
  then(response => {
    dispatch(setEditSearchEntities(response));
  });
}

function selectSemanticSearchDocument(doc) {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('semanticSearch/selectedDocument', doc));
    dispatch(_BasicReducer.actions.set('library.sidepanel.tab', 'semantic-search-results'));
  };
}

function unselectSemanticSearchDocument() {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('semanticSearch/selectedDocument', {}));
  };
}

function sanitizeSearchFilters(filters) {
  return Object.keys(filters).
  reduce((partial, key) => {
    const emptyFilter = !filters[key] || _typeof(filters[key]) === 'object' && !Object.keys(filters[key]).length;
    if (emptyFilter) {
      return partial;
    }
    return _objectSpread({}, partial, { [key]: filters[key] });
  }, {});
}

function submitNewSearch(args) {
  const { searchTerm } = args;
  const query = Object.assign({}, args, { searchTerm: '' }, { filters: sanitizeSearchFilters(args.filters) });
  const search = Object.assign({ searchTerm, query });

  return dispatch => _SemanticSearchAPI.default.search(new _RequestParams.RequestParams(search)).
  then(() => dispatch(fetchSearches()));
}

function showSemanticSearch() {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('semanticSearch/showSemanticSearchPanel', true));
  };
}

function hideSemanticSearch() {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('semanticSearch/showSemanticSearchPanel', false));
  };
}

function deleteSearch(searchId) {
  return dispatch => _SemanticSearchAPI.default.deleteSearch(new _RequestParams.RequestParams({ searchId })).
  then(() => {
    dispatch(fetchSearches());
  });
}

function stopSearch(searchId) {
  return dispatch => _SemanticSearchAPI.default.stopSearch(new _RequestParams.RequestParams({ searchId })).
  then(() => {
    dispatch(fetchSearches());
  });
}

function resumeSearch(searchId) {
  return dispatch => _SemanticSearchAPI.default.resumeSearch(new _RequestParams.RequestParams({ searchId })).
  then(() => {
    dispatch(fetchSearches());
  });
}

function registerForUpdates() {
  return () => _SemanticSearchAPI.default.registerForUpdates();
}

function updateSearch(updatedSearch) {
  return dispatch => dispatch(_BasicReducer.actions.update('semanticSearch/searches', updatedSearch));
}

function addSearchResults(newDocs) {
  return (dispatch, getState) => {
    const currentSearch = getState().semanticSearch.search;
    const newResults = currentSearch.update('results', existingDocs => newDocs.
    reduce((updatedDocs, newDoc) => {
      if (!updatedDocs.find(d => newDoc._id === d.get('_id'))) {
        return updatedDocs.push(_immutable.default.fromJS(newDoc));
      }
      return updatedDocs;
    }, existingDocs));
    dispatch(_BasicReducer.actions.set('semanticSearch/search', newResults));
  };
}

function getSearch(searchId, args) {
  const requestParams = new _RequestParams.RequestParams(_objectSpread({ searchId }, args));
  return (dispatch, getState) => _SemanticSearchAPI.default.getSearch(requestParams).
  then(search => {
    dispatch(_BasicReducer.actions.set('semanticSearch/search', search));
    const selectedDoc = getState().semanticSearch.selectedDocument;
    if (selectedDoc) {
      const updatedDoc = search.results.find(doc => doc.sharedId === selectedDoc.get('sharedId'));
      if (updatedDoc) {
        dispatch(_BasicReducer.actions.set('semanticSearch/selectedDocument', updatedDoc));
      }
    }
  });
}

function getMoreSearchResults(searchId, args) {
  const requestParams = new _RequestParams.RequestParams(_objectSpread({ searchId }, args));
  return dispatch => _SemanticSearchAPI.default.getSearch(requestParams).
  then((search) =>
  dispatch(_BasicReducer.actions.concatIn('semanticSearch/search', ['results'], search.results)));

}