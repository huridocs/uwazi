"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ShowSidepanelMenu = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));

var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ShowSidepanelMenu extends _react.Component {
  render() {
    const { panelIsOpen, openPanel, active } = this.props;
    return (
      _jsx("div", { className: active ? 'active' : '' }, void 0,
      _jsx(_ShowIf.default, { if: !panelIsOpen }, void 0,
      _jsx("div", { className: "btn btn-primary", onClick: e => openPanel(e) }, void 0,
      _jsx(_UI.Icon, { icon: "chart-bar" })))));




  }}exports.ShowSidepanelMenu = ShowSidepanelMenu;


ShowSidepanelMenu.defaultProps = {
  active: false };var _default =








ShowSidepanelMenu;exports.default = _default;