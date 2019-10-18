"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Settings = void 0;var _react = _interopRequireDefault(require("react"));
var _reactHelmet = _interopRequireDefault(require("react-helmet"));

var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _UsersAPI = _interopRequireDefault(require("../Users/UsersAPI"));
var _ThesaurisAPI = _interopRequireDefault(require("../Thesauris/ThesaurisAPI"));
var _RelationTypesAPI = _interopRequireDefault(require("../RelationTypes/RelationTypesAPI"));
var _BasicReducer = require("../BasicReducer");
var _I18N = require("../I18N");
var _SettingsNavigation = _interopRequireDefault(require("./components/SettingsNavigation"));
var _SettingsAPI = _interopRequireDefault(require("./SettingsAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Settings extends _RouteHandler.default {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, dictionaries, relationTypes, translations, collection] =
    await Promise.all([
    _UsersAPI.default.currentUser(request),
    _ThesaurisAPI.default.getDictionaries(request),
    _RelationTypesAPI.default.get(request),
    _I18N.I18NApi.get(request),
    _SettingsAPI.default.get(request)]);


    return [
    _BasicReducer.actions.set('auth/user', user),
    _BasicReducer.actions.set('dictionaries', dictionaries),
    _BasicReducer.actions.set('relationTypes', relationTypes),
    _BasicReducer.actions.set('translations', translations),
    _BasicReducer.actions.set('settings/collection', collection)];

  }

  render() {
    return (
      _jsx("div", { className: "row settings" }, void 0,
      _jsx(_reactHelmet.default, { title: "Settings" }),
      _jsx("div", { className: "settings-navigation" }, void 0,
      _jsx(_SettingsNavigation.default, {})),

      _jsx("div", { className: "settings-content" }, void 0,
      this.props.children)));



  }}exports.Settings = Settings;var _default =


Settings;exports.default = _default;