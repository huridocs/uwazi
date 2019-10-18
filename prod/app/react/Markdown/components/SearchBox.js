"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactReduxForm = require("react-redux-form");
var _reactRouter = require("react-router");
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _rison = _interopRequireDefault(require("rison"));
var _UI = require("../../UI");
var _SearchTips = _interopRequireDefault(require("../../Library/components/SearchTips"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const search = ({ searchTerm }) => {
  _reactRouter.browserHistory.push(`/library/?q=${_rison.default.encode({ searchTerm })}`);
};

const SearchBox = ({ placeholder, classname }) =>
_jsx("div", { className: `search-box ${classname}` }, void 0,
_jsx(_reactReduxForm.Form, { model: "library.search", onSubmit: search }, void 0,
_jsx("div", { className: "input-group" }, void 0,
_jsx("button", { type: "submit", className: "btn btn-primary" }, void 0,
_jsx(_UI.Icon, { icon: "search" })),

_jsx(_reactReduxForm.Field, { model: ".searchTerm" }, void 0,
_jsx("input", { className: "form-control", type: "text", placeholder: placeholder })))),



_jsx(_SearchTips.default, {}));



SearchBox.defaultProps = {
  placeholder: '',
  classname: '' };var _default =







SearchBox;exports.default = _default;