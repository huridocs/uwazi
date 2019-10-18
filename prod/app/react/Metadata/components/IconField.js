"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.IconField = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");

var _ReactReduxForms = require("../../ReactReduxForms");
var _ = require("./..");
var _Forms = require("../../Forms");
var _ToggleDisplay = _interopRequireDefault(require("../../Layout/ToggleDisplay"));
var _redux = require("redux");
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const IconField = ({ model, removeIcon }) =>
_jsx(_Forms.FormValue, { model: `${model}.icon` }, void 0,
(icon = {}) =>
_jsx("div", { className: "icon-selector" }, void 0,
_jsx(_ToggleDisplay.default, {
  showLabel: _jsx("span", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "add icon"), _jsx(_UI.Icon, { icon: "eye" })),
  hideLabel: _jsx("span", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "remove icon"), _jsx(_UI.Icon, { icon: "eye-slash" })),
  onHide: () => removeIcon(`${model}.icon`),
  open: !!icon._id }, void 0,

_jsx("ul", { className: "search__filter" }, void 0,
_jsx("li", {}, void 0, _jsx("label", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Icon"), " / ", _jsx(_I18N.Translate, {}, void 0, "Flag"))),
_jsx("li", { className: "wide" }, void 0,
_jsx(_ReactReduxForms.IconSelector, { model: ".icon" }))))));exports.IconField = IconField;













function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ removeIcon: _.actions.removeIcon }, dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(IconField);exports.default = _default;