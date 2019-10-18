"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.search = search;exports.searchReferences = searchReferences;exports.connectionsChanged = connectionsChanged;exports.deleteConnection = deleteConnection;exports.loadAllReferences = loadAllReferences;exports.loadMoreReferences = loadMoreReferences;exports.setFilter = setFilter;exports.resetSearch = resetSearch;exports.switchView = switchView;var _BasicReducer = require("../../BasicReducer");
var _reactReduxForm = require("react-redux-form");
var _Notifications = require("../../Notifications");
var _referencesAPI = _interopRequireDefault(require("../../Viewer/referencesAPI"));
var _immutable = require("immutable");
var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _RequestParams = require("../../utils/RequestParams");

var uiActions = _interopRequireWildcard(require("../../Entities/actions/uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function search(requestParams) {
  const { sharedId, sort, filters } = requestParams.data;
  const searchTerm = requestParams.data.search && requestParams.data.search.searchTerm ? requestParams.data.search.searchTerm.value : '';

  let options = _objectSpread({ sharedId }, sort);
  if (filters) {
    options = _objectSpread({ sharedId }, sort, {}, filters.toJS(), { searchTerm });
  }
  return _referencesAPI.default.search(requestParams.onlyHeaders().add(options));
}

function searchReferences() {
  return async (dispatch, getState) => {
    const relationshipsList = getState().relationships.list;
    const results = await search(new _RequestParams.RequestParams(relationshipsList));
    dispatch(_BasicReducer.actions.set('relationships/list/searchResults', results));
    dispatch(uiActions.showTab('connections'));
  };
}

function connectionsChanged() {
  return (dispatch, getState) => {
    const relationshipsList = getState().relationships.list;
    const { sharedId } = relationshipsList;

    return _referencesAPI.default.getGroupedByConnection(new _RequestParams.RequestParams({ sharedId })).
    then(connectionsGroups => {
      const filteredTemplates = connectionsGroups.reduce((templateIds, group) => templateIds.concat(group.templates.map(t => t._id.toString())), []);

      const sortOptions = _prioritySortingCriteria.default.get({
        currentCriteria: relationshipsList.sort,
        filteredTemplates,
        templates: getState().templates });

      return Promise.all([connectionsGroups, sortOptions]);
    }).
    then(([connectionsGroups, sort]) => {
      dispatch(_BasicReducer.actions.set('relationships/list/connectionsGroups', connectionsGroups));
      dispatch(_reactReduxForm.actions.merge('relationships/list.sort', sort));
      return searchReferences()(dispatch, getState);
    });
  };
}

function deleteConnection(connection) {
  return async (dispatch, getState) => {
    await _referencesAPI.default.delete(new _RequestParams.RequestParams({ _id: connection._id }));
    dispatch(_Notifications.notificationActions.notify('Connection deleted', 'success'));
    return connectionsChanged()(dispatch, getState);
  };
}

function loadAllReferences() {
  return async (dispatch, getState) => {
    const relationshipsList = getState().relationships.list;
    dispatch(_BasicReducer.actions.set('relationships/list/filters', relationshipsList.filters.set('limit', 9999)));
    return searchReferences()(dispatch, getState);
  };
}

function loadMoreReferences(limit) {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    dispatch(_BasicReducer.actions.set('relationships/list/filters', relationshipsList.filters.set('limit', limit)));
    return searchReferences()(dispatch, getState);
  };
}

function setFilter(groupFilterValues) {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    const currentFilter = relationshipsList.filters.get('filter') || (0, _immutable.fromJS)({});
    const newFilter = currentFilter.merge(groupFilterValues);
    dispatch(_BasicReducer.actions.set('relationships/list/filters', relationshipsList.filters.set('filter', newFilter)));
    return searchReferences()(dispatch, getState);
  };
}

function resetSearch() {
  return function (dispatch, getState) {
    dispatch(_reactReduxForm.actions.change('relationships/list/search.searchTerm', ''));
    dispatch(_BasicReducer.actions.set('relationships/list/filters', (0, _immutable.fromJS)({})));
    return searchReferences()(dispatch, getState);
  };
}

function switchView(type) {
  return function (dispatch, getState) {
    dispatch(_BasicReducer.actions.set('relationships/list/view', type));
    if (type === 'graph') {
      return loadAllReferences()(dispatch, getState);
    }
  };
}