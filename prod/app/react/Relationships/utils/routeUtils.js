"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.requestState = requestState;exports.emptyState = emptyState;exports.setReduxState = setReduxState;
var _immutable = require("immutable");
var _reactReduxForm = require("react-redux-form");

var _BasicReducer = require("../../BasicReducer");
var _ConnectionsList = require("../../ConnectionsList");
var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _referencesAPI = _interopRequireDefault(require("../../Viewer/referencesAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} // TEST!!!

function requestState(requestParams, state) {
  return _referencesAPI.default.getGroupedByConnection(requestParams).
  then(connectionsGroups => {
    const filteredTemplates = connectionsGroups.reduce((templateIds, group) => templateIds.concat(group.templates.map(t => t._id.toString())), []);

    const sortOptions = _prioritySortingCriteria.default.get({ currentCriteria: {}, filteredTemplates, templates: state.templates });
    const params = state.relationships ? state.relationships.list : {};
    params.sort = params.sort || sortOptions;
    params.filters = (0, _immutable.fromJS)({ limit: 10 });
    params.sharedId = requestParams.data.sharedId;
    const newParams = requestParams.add(params);
    return Promise.all([connectionsGroups, _ConnectionsList.actions.search(newParams), params.sort, params.filters]);
  });
}

function emptyState() {
  return dispatch => {
    dispatch(_BasicReducer.actions.unset('relationships/list/sharedId'));
    dispatch(_BasicReducer.actions.unset('relationships/list/entity'));
    dispatch(_BasicReducer.actions.unset('relationships/list/connectionsGroups'));
    dispatch(_BasicReducer.actions.unset('relationships/list/searchResults'));
    dispatch(_BasicReducer.actions.unset('relationships/list/filters'));
    dispatch(_BasicReducer.actions.unset('relationships/list.sort'));
    dispatch(_BasicReducer.actions.unset('relationships/list/view'));

    dispatch(_BasicReducer.actions.set('relationships/connection', {}));
  };
}

function setReduxState(state) {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('relationships/list/sharedId', state.relationships.list.sharedId));
    dispatch(_BasicReducer.actions.set('relationships/list/entity', state.relationships.list.entity));
    dispatch(_BasicReducer.actions.set('relationships/list/connectionsGroups', state.relationships.list.connectionsGroups));
    dispatch(_BasicReducer.actions.set('relationships/list/searchResults', state.relationships.list.searchResults));
    dispatch(_BasicReducer.actions.set('relationships/list/filters', state.relationships.list.filters));
    dispatch(_reactReduxForm.actions.merge('relationships/list.sort', state.relationships.list.sort));
    dispatch(_BasicReducer.actions.set('relationships/list/view', state.relationships.list.view));
  };
}