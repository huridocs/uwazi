"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.FormValue = void 0;var _reactRedux = require("react-redux");
var _reactReduxForm = require("react-redux-form");

const FormValue = ({ value, children }) => children(value);exports.FormValue = FormValue;

const mapStateToProps = (state, { model }) => ({ value: (0, _reactReduxForm.getModel)(state, model) });exports.mapStateToProps = mapStateToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormValue);exports.default = _default;