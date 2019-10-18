"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.UploadsHeader = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _uploadsActions = require("../actions/uploadsActions");
var _I18N = require("../../I18N");
var _Multireducer = require("../../Multireducer");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class UploadsHeader extends _react.Component {
  render() {
    return (
      _jsx("div", { className: "content-header" }, void 0,
      _jsx("div", { className: "content-header-title" }, void 0,
      _jsx("h1", { className: "item-name" }, void 0, (0, _I18N.t)('System', 'My Files')),
      _jsx("button", { type: "button", className: "btn btn-success btn-xs", onClick: this.props.newEntity }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }), " ", (0, _I18N.t)('System', 'New entity')),

      _jsx("button", { type: "button", className: "btn btn-success btn-xs", onClick: this.props.showImportPanel }, void 0,
      _jsx(_UI.Icon, { icon: "upload" }), " ", (0, _I18N.t)('System', 'Import')))));




  }}exports.UploadsHeader = UploadsHeader;







function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ newEntity: _uploadsActions.newEntity, showImportPanel: _uploadsActions.showImportPanel }, (0, _Multireducer.wrapDispatch)(dispatch, 'uploads'));
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(UploadsHeader);exports.default = _default;