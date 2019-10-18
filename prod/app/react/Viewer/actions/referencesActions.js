"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.setReferences = setReferences;exports.loadReferences = loadReferences;exports.addReference = addReference;exports.saveTargetRangedReference = saveTargetRangedReference;exports.deleteReference = deleteReference;var types = _interopRequireWildcard(require("./actionTypes"));
var _referencesAPI = _interopRequireDefault(require("../referencesAPI"));
var _Notifications = require("../../Notifications");
var _BasicReducer = require("../../BasicReducer");
var _RequestParams = require("../../utils/RequestParams");

var _Connections = require("../../Connections");
var _actions = require("../../Relationships/actions/actions");
var uiActions = _interopRequireWildcard(require("./uiActions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references };

}

function loadReferences(sharedId) {
  return dispatch => _referencesAPI.default.get(new _RequestParams.RequestParams({ sharedId })).
  then(references => {
    dispatch(setReferences(references));
  });
}

function addReference(references, docInfo, delayActivation) {
  return (dispatch, getState) => {
    const tab = 'references';

    dispatch({ type: types.ADD_REFERENCE, reference: references[0][1] });
    dispatch({ type: types.ADD_REFERENCE, reference: references[0][0] });

    dispatch(_BasicReducer.actions.unset('viewer/targetDoc'));
    dispatch(_BasicReducer.actions.unset('viewer/targetDocHTML'));
    dispatch(_BasicReducer.actions.unset('viewer/targetDocReferences'));
    dispatch((0, _actions.reloadRelationships)(getState().relationships.list.sharedId));

    dispatch(uiActions.activateReference(references[0][0], docInfo, tab, delayActivation));
  };
}

function saveTargetRangedReference(connection, targetRange, onCreate) {
  return (dispatch, getState) => {
    if (targetRange.text) {
      dispatch(_BasicReducer.actions.unset('viewer/targetDocReferences'));
      return _Connections.actions.saveConnection(_objectSpread({}, connection, { targetRange }), onCreate)(dispatch, getState);
    }
    return undefined;
  };
}

function deleteReference(reference) {
  const { _id } = reference.associatedRelationship;
  return (dispatch, getState) => _referencesAPI.default.delete(new _RequestParams.RequestParams({ _id })).
  then(() => {
    dispatch((0, _actions.reloadRelationships)(getState().relationships.list.sharedId));
    dispatch({ type: types.REMOVE_REFERENCE, reference });
    dispatch(_Notifications.notificationActions.notify('Connection deleted', 'success'));
  });
}