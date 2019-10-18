"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  data: (0, _reactReduxForm.modelReducer)('thesauri.data', { name: '', values: [{ label: '', id: (0, _uniqueID.default)() }] }),
  formState: (0, _reactReduxForm.formReducer)('thesauri.data', { name: '', values: [{ label: '', id: (0, _uniqueID.default)() }] }) });exports.default = _default;