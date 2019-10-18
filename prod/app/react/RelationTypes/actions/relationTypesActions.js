"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.editRelationType = editRelationType;exports.deleteRelationType = deleteRelationType;exports.checkRelationTypeCanBeDeleted = checkRelationTypeCanBeDeleted;var _RelationTypesAPI = _interopRequireDefault(require("../RelationTypesAPI"));
var _reactReduxForm = require("react-redux-form");
var _referencesAPI = _interopRequireDefault(require("../../Viewer/referencesAPI"));
var _BasicReducer = require("../../BasicReducer");
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function editRelationType(relationType) {
  return _reactReduxForm.actions.load('template.data', relationType);
}

function deleteRelationType(relationType) {
  return function (dispatch) {
    return _RelationTypesAPI.default.delete(new _RequestParams.RequestParams({ _id: relationType._id })).then(() => {
      dispatch(_BasicReducer.actions.remove('relationTypes', relationType));
    });
  };
}

function checkRelationTypeCanBeDeleted(relationType) {
  return function () {
    return _referencesAPI.default.countByRelationType(new _RequestParams.RequestParams({ relationtypeId: relationType._id })).
    then(count => {
      if (count) {
        return Promise.reject();
      }
    });
  };
}