"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Cookiepopup = void 0;var Cookie = _interopRequireWildcard(require("tiny-cookie"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _utils = require("../utils");
var _I18N = require("../I18N");

var _Notification = require("../Notifications/components/Notification");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Cookiepopup extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { cookieExists: !_utils.isClient || _utils.isClient && Boolean(Cookie.get('cookiepolicy')) };
    this.close = this.close.bind(this);
  }

  close() {
    Cookie.set('cookiepolicy', 1, { expires: 365 * 10 });
    this.setState({ cookieExists: true });
  }

  render() {
    const { cookiepolicy } = this.props;
    const { cookieExists } = this.state;
    if (!cookiepolicy || cookieExists) {
      return _jsx("div", { className: "alert-wrapper" });
    }

    const message = _jsx(_I18N.Translate, {}, void 0, "To bring you a better experience, this site uses cookies.");
    return (
      _jsx("div", { className: "alert-wrapper" }, void 0,
      _jsx(_Notification.Notification, { id: "cookiepolicy", removeNotification: this.close, message: message })));


  }}exports.Cookiepopup = Cookiepopup;






const mapStateToProps = state => ({
  cookiepolicy: Boolean(state.settings.collection.get('cookiepolicy')) });var _default =


(0, _reactRedux.connect)(mapStateToProps)(Cookiepopup);exports.default = _default;