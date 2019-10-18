"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.SettingsNavigation = void 0;var _react = _interopRequireWildcard(require("react"));
var _I18N = require("../../I18N");
var _Auth = require("../../Auth");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SettingsNavigation extends _react.Component {
  render() {
    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Settings')),
      _jsx("div", { className: "list-group" }, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/account", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Account')),
      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/users", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Users'))),

      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/collection", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Collection'))),

      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/navlinks", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Menu'))),

      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/pages", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Pages'))),

      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/languages", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Languages'))),

      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/translations", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Translations'))),

      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/filters", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Filters configuration'))))),



      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Metadata')),
      _jsx("div", { className: "list-group" }, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/templates", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Templates')),
      _jsx(_I18N.I18NLink, { to: "settings/dictionaries", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Thesauri')),
      _jsx(_I18N.I18NLink, { to: "settings/connections", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Relationship types'))))),



      _jsx(_Auth.NeedAuthorization, { roles: ['admin'] }, void 0,
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Tools')),
      _jsx("div", { className: "list-group" }, void 0,
      _jsx(_I18N.I18NLink, { to: "settings/activitylog", activeClassName: "active", className: "list-group-item" }, void 0, (0, _I18N.t)('System', 'Activity log')))))));





  }}exports.SettingsNavigation = SettingsNavigation;var _default =


SettingsNavigation;exports.default = _default;