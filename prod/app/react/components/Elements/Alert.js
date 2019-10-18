"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
require("./scss/alert.scss");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Alert extends _react.Component {
  constructor(props) {
    super(props);
    const { message } = this.props;
    this.state = { show: !!message };
  }

  hide() {
    this.setState({ show: false });
  }

  show() {
    this.setState({ show: true });
  }

  render() {
    const { show } = this.state;
    const { type, message } = this.props;
    const cssClass = `alert alert-${type}`;
    let icon = 'info-circle';

    if (type === 'warning' || type === 'danger') {
      icon = 'exclamation-triangle';
    }

    return (
      _jsx("div", { className: "alert-wrapper" }, void 0,
      show &&
      _jsx("div", { className: cssClass }, void 0,
      _jsx("span", { className: "alert-icon" }, void 0,
      _jsx(_UI.Icon, { icon: icon })),

      _jsx("span", { className: "alert-message" }, void 0, message),
      _jsx("a", { onClick: this.hide, className: "alert-close" }, void 0,
      _jsx(_UI.Icon, { icon: "times" })))));





  }}


Alert.defaultProps = {
  message: '',
  type: 'info' };var _default =







Alert;exports.default = _default;