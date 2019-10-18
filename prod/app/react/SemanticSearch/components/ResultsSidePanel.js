"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.ResultsSidePanel = ResultsSidePanel;exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _ResultsFiltersPanel = _interopRequireDefault(require("./ResultsFiltersPanel"));
var _DocumentResultsPanel = _interopRequireDefault(require("./DocumentResultsPanel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function ResultsSidePanel() {
  return (
    _jsx(_react.default.Fragment, {}, void 0,
    _jsx(_ResultsFiltersPanel.default, { storeKey: "library" }),
    _jsx(_DocumentResultsPanel.default, {})));


}var _default =

(0, _reactRedux.connect)()(ResultsSidePanel);exports.default = _default;