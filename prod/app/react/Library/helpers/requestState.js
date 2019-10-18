"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = requestState;var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _rison = _interopRequireDefault(require("rison"));
var _SearchAPI = _interopRequireDefault(require("../../Search/SearchAPI"));
var _libraryFilters = _interopRequireDefault(require("./libraryFilters"));
var _setReduxState = _interopRequireDefault(require("./setReduxState.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}

function processQuery(_query, globalResources, key) {
  const defaultSearch = _prioritySortingCriteria.default.get({ templates: globalResources.templates });

  let query;
  try {
    query = _rison.default.decode(_query.q || '()');
  } catch (error) {
    error.status = 404;
    throw error;
  }

  query.order = query.order || defaultSearch.order;
  query.sort = query.sort || defaultSearch.sort;
  query.view = _query.view;

  if (key === 'markers') {
    query.geolocation = true;
  }
  const { userSelectedSorting } = query,sanitizedQuery = _objectWithoutProperties(query, ["userSelectedSorting"]);
  return sanitizedQuery;
}

function requestState(request, globalResources) {
  const documentsRequest = _objectSpread({},
  request, {
    data: processQuery(request.data, globalResources) });


  const markersRequest = _objectSpread({},
  request, {
    data: processQuery(request.data, globalResources, 'markers') });


  return Promise.all([_SearchAPI.default.search(documentsRequest), _SearchAPI.default.search(markersRequest)]).
  then(([documents, markers]) => {
    const filterState = _libraryFilters.default.URLQueryToState(
    documentsRequest.data,
    globalResources.templates.toJS(),
    globalResources.thesauris.toJS(),
    globalResources.relationTypes.toJS());

    const state = {
      library: {
        filters: { documentTypes: documentsRequest.data.types || [], properties: filterState.properties },
        aggregations: documents.aggregations,
        search: filterState.search,
        documents,
        markers } };



    return [
    (0, _setReduxState.default)(state)];

  });
}