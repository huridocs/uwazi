"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRedux = require("react-redux");
var _reactRouter = require("react-router");
var _react = _interopRequireDefault(require("react"));

var _Provider = _interopRequireDefault(require("./App/Provider"));
var _Routes = _interopRequireDefault(require("./Routes"));
var _store = require("./store.js");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const App = () =>
_jsx(_reactRedux.Provider, { store: _store.store }, void 0,
_jsx(_Provider.default, {}, void 0,
_jsx(_reactRouter.Router, { history: _reactRouter.browserHistory }, void 0, _Routes.default)));var _default =




App;exports.default = _default;