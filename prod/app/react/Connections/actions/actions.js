"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.immidiateSearch = immidiateSearch;exports.search = search;exports.startNewConnection = startNewConnection;exports.setRelationType = setRelationType;exports.setTargetDocument = setTargetDocument;exports.saveConnection = saveConnection;exports.selectRangedTarget = selectRangedTarget;var _BasicReducer = require("../../BasicReducer");
var _Notifications = require("../../Notifications");
var _api = _interopRequireDefault(require("../../utils/api"));
var _debounce = _interopRequireDefault(require("../../utils/debounce"));
var _RequestParams = require("../../utils/RequestParams");

var types = _interopRequireWildcard(require("./actionTypes"));
var uiActions = _interopRequireWildcard(require("./uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function immidiateSearch(dispatch, searchTerm, connectionType) {
  dispatch(uiActions.searching());

  const requestParams = new _RequestParams.RequestParams({ searchTerm, fields: ['title'] });

  return _api.default.get('search', requestParams).
  then(response => {
    let results = response.json.rows;
    if (connectionType === 'targetRanged') {
      results = results.filter(r => r.type !== 'entity');
    }
    dispatch(_BasicReducer.actions.set('connections/searchResults', results));
  });
}

const debouncedSearch = (0, _debounce.default)(immidiateSearch, 400);

function search(searchTerm, connectionType) {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('connections/searchTerm', searchTerm));
    return debouncedSearch(dispatch, searchTerm, connectionType);
  };
}

function startNewConnection(connectionType, sourceDocument) {
  return dispatch => immidiateSearch(dispatch, '', connectionType).
  then(() => {
    dispatch(_BasicReducer.actions.set('connections/searchTerm', ''));
    dispatch(uiActions.openPanel(connectionType, sourceDocument));
  });
}

function setRelationType(template) {
  return {
    type: types.SET_RELATION_TYPE,
    template };

}

function setTargetDocument(id) {
  return {
    type: types.SET_TARGET_DOCUMENT,
    id };

}

function saveConnection(connection, callback = () => {}) {
  return (dispatch, getState) => {
    dispatch({ type: types.CREATING_CONNECTION });
    if (connection.type !== 'basic') {
      connection.language = getState().locale;
    }

    delete connection.type;

    const sourceRelationship = { entity: connection.sourceDocument, template: null, range: connection.sourceRange };

    const targetRelationship = { entity: connection.targetDocument, template: connection.template };
    if (connection.targetRange && typeof connection.targetRange.start !== 'undefined') {
      targetRelationship.range = connection.targetRange;
    }

    const apiCall = {
      delete: [],
      save: [[sourceRelationship, targetRelationship]] };


    return _api.default.post('relationships/bulk', new _RequestParams.RequestParams(apiCall)).
    then(response => {
      dispatch({ type: types.CONNECTION_CREATED });
      callback(response.json);
      dispatch(_Notifications.notificationActions.notify('saved successfully !', 'success'));
    });
  };
}

function selectRangedTarget(connection, onRangedConnect) {
  return dispatch => {
    dispatch({ type: types.CREATING_RANGED_CONNECTION });
    onRangedConnect(connection.targetDocument);
  };
}