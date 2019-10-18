"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = require("immutable");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const DescriptionWrapper = props => {
  const { entry, toggleExpand, expanded, children } = props;

  return (
    _jsx("div", {}, void 0,
    _jsx("div", {}, void 0,
    _jsx("span", { className: "expand", onClick: () => {toggleExpand();} }, void 0,
    children)),


    expanded &&
    _jsx("div", { className: "expanded-content" }, void 0,
    _jsx("table", {}, void 0,
    _jsx("tbody", {}, void 0,
    entry.getIn(['semantic', 'beautified']) &&
    _jsx("tr", {}, void 0,
    _jsx("td", {}, void 0, "Route"),
    _jsx("td", {}, void 0, entry.get('method'), " : ", entry.get('url'))),


    _jsx("tr", {}, void 0,
    _jsx("td", {}, void 0, "Query"),
    _jsx("td", { className: "tdquery" }, void 0, entry.get('query'))),

    _jsx("tr", {}, void 0,
    _jsx("td", {}, void 0, "Body"),
    _jsx("td", { className: "tdbody" }, void 0, entry.get('body'))))))));







};

DescriptionWrapper.defaultProps = {
  children: _jsx("span", {}),
  expanded: false };var _default =









DescriptionWrapper;exports.default = _default;