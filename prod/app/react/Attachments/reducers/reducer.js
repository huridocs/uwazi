"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _progressReducer = _interopRequireDefault(require("./progressReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  progress: _progressReducer.default,
  edit: (0, _redux.combineReducers)({
    attachment: (0, _reactReduxForm.modelReducer)('attachments.edit.attachment'),
    form: (0, _reactReduxForm.formReducer)('attachments.edit.attachment') }) });exports.default = _default;