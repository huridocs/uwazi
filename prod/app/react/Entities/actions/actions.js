"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.saveEntity = saveEntity;exports.deleteEntity = deleteEntity;exports.deleteEntities = deleteEntities;var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../utils/RequestParams");

var _BasicReducer = require("../../BasicReducer");
var _Notifications = require("../../Notifications");
var _libraryActions = require("../../Library/actions/libraryActions");
var _Relationships = require("../../Relationships");

var _EntitiesAPI = _interopRequireDefault(require("../EntitiesAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function saveEntity(entity) {
  return dispatch => _EntitiesAPI.default.save(new _RequestParams.RequestParams(entity)).
  then(response => {
    dispatch(_Notifications.notificationActions.notify('Entity saved', 'success'));
    dispatch(_reactReduxForm.actions.reset('entityView.entityForm'));
    dispatch(_BasicReducer.actions.set('entityView/entity', response));
    dispatch(_Relationships.actions.reloadRelationships(response.sharedId));
  });
}

function deleteEntity(entity) {
  return dispatch => _EntitiesAPI.default.delete(new _RequestParams.RequestParams({ sharedId: entity.sharedId })).
  then(() => {
    dispatch(_Notifications.notificationActions.notify('Entity deleted', 'success'));
    dispatch((0, _libraryActions.removeDocument)(entity));
    dispatch((0, _libraryActions.unselectDocument)(entity._id));
  });
}

function deleteEntities(entities) {
  return dispatch => _EntitiesAPI.default.deleteMultiple(
  new _RequestParams.RequestParams({ sharedIds: entities.map(e => e.sharedId) })).

  then(() => {
    dispatch(_Notifications.notificationActions.notify('Deletion success', 'success'));
    dispatch((0, _libraryActions.unselectAllDocuments)());
    dispatch((0, _libraryActions.removeDocuments)(entities));
  });
}