"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");var _default =

(0, _redux.combineReducers)({
  form: (0, _reactReduxForm.modelReducer)('login.form', { username: '', password: '' }),
  formState: (0, _reactReduxForm.formReducer)('login.form') });exports.default = _default;