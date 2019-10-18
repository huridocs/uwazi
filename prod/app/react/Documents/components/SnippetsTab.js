"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const SnippetsTab = ({ snippets }) =>
_jsx("div", {}, void 0,
_jsx(_UI.Icon, { icon: "search" }),
_jsx("span", { className: "connectionsNumber" }, void 0, snippets.get('count') ? snippets.get('count') : ''),
_jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Search text')));







function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(SnippetsTab);exports.default = _default;