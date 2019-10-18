"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.editThesauri = editThesauri;exports.deleteThesauri = deleteThesauri;exports.checkThesauriCanBeDeleted = checkThesauriCanBeDeleted;exports.reloadThesauris = reloadThesauris;var _ThesaurisAPI = _interopRequireDefault(require("../ThesaurisAPI"));
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = require("../../BasicReducer");
var _TemplatesAPI = _interopRequireDefault(require("../../Templates/TemplatesAPI"));
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function editThesauri(thesauri) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.reset('thesauri.data'));
    dispatch(_reactReduxForm.actions.load('thesauri.data', thesauri));
  };
}

function deleteThesauri(thesauri) {
  return dispatch => _ThesaurisAPI.default.delete(new _RequestParams.RequestParams({ _id: thesauri._id })).
  then(() => {
    dispatch(_BasicReducer.actions.remove('dictionaries', thesauri));
  });
}

function checkThesauriCanBeDeleted(thesauri) {
  return () => _TemplatesAPI.default.countByThesauri(new _RequestParams.RequestParams({ _id: thesauri._id })).
  then(count => count ? Promise.reject() : null);
}

function reloadThesauris() {
  return dispatch => _ThesaurisAPI.default.get().
  then(response => {
    dispatch(_BasicReducer.actions.set('thesauris', response));
  });
}