"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _I18N = require("../I18N");
var _reselect = require("reselect");
var _Auth = require("../Auth");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Footer extends _react.Component {
  render() {
    return (
      _jsx("footer", {}, void 0,
      _jsx("ul", { className: "footer-nav" }, void 0,

      _jsx("li", { className: "footer-nav_item" }, void 0,
      _jsx("div", { className: "footer-tooltip" }, void 0,
      _jsx("p", {}, void 0, "Uwazi is developed by ", _jsx("img", { src: "/public/huridocs-logo.svg", title: "uwazi", alt: "uwazi" })),
      _jsx("p", {}, void 0, "in Kenya, Ecuador, Spain, Germany and USA.")),

      _jsx("a", { href: "https://www.uwazi.io/", target: "_blank", className: "footer-logo" }, void 0,
      _jsx("img", { src: "/public/logo.svg", title: "uwazi", alt: "uwazi" }))),



      _jsx("li", { className: "footer-nav_separator" }, void 0, "\xA0"),

      _jsx("li", { className: "footer-nav_item footer-collection_name" }, void 0,
      _jsx("span", {}, void 0, this.props.siteName)),


      _jsx("li", { className: "footer-nav_separator" }, void 0, "\xA0"),

      _jsx("li", { className: "footer-nav_item" }, void 0,
      _jsx(_I18N.I18NLink, { to: "/library" }, void 0, (0, _I18N.t)('System', 'Library'))),

      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("li", { className: "footer-nav_item" }, void 0,
      _jsx(_I18N.I18NLink, { to: "/uploads" }, void 0, (0, _I18N.t)('System', 'Uploads')))),


      (() => {
        if (!this.props.user._id) {
          return (
            _jsx("li", { className: "footer-nav_item" }, void 0,
            _jsx(_I18N.I18NLink, { to: "/login" }, void 0, (0, _I18N.t)('System', 'Login'))));


        }

        return (
          _jsx("li", { className: "footer-nav_item" }, void 0,
          _jsx(_I18N.I18NLink, { to: "/settings" }, void 0, (0, _I18N.t)('System', 'Settings'))));


      })())));




  }}








const selectUser = (0, _reselect.createSelector)(s => s.user, u => u.toJS());

function mapStateToProps(state) {
  return {
    user: selectUser(state),
    siteName: state.settings.collection.get('site_name') };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(Footer);exports.default = _default;