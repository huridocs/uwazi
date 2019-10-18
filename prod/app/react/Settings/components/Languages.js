"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.Languages = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _languagesList = require("../../../shared/languagesList");



var _Warning = _interopRequireDefault(require("../../Layout/Warning"));
var _Tip = _interopRequireDefault(require("../../Layout/Tip"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Languages extends _react.Component {
  static defaultLanguage() {
    return (
      _jsx("span", {}, void 0,
      (0, _I18N.t)('System', 'Default language'),
      _jsx(_Tip.default, {}, void 0, "This language will be used as default translation when adding new languages, and the default language for the site when no other language has been selected.")));





  }

  static notSupportedLanguage() {
    return (
      _jsx(_Warning.default, {}, void 0, "Some adavanced search features may not be available for this language."));

  }

  constructor(props) {
    super(props);
    this.state = {
      languageToDelete: {},
      languageToAdd: {} };

  }

  setAsDeafultButton(language) {
    return (
      _jsx("button", { type: "button", onClick: this.setDefault.bind(this, language), className: "btn btn-success btn-xs template-remove" }, void 0,
      _jsx(_UI.Icon, { prefix: "far", icon: "star" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Set as default'))));


  }

  deleteButton(language) {
    return (
      _jsx("button", {
        disabled: language.key === this.props.locale,
        className: "btn btn-danger btn-xs template-remove",
        onClick: this.deleteLanguage.bind(this, language),
        type: "button" }, void 0,

      _jsx(_UI.Icon, { icon: "trash-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Delete language'))));


  }

  setDefault(language) {
    this.props.setDefaultLanguage(language.key);
  }

  deleteLanguage(language) {
    this.context.confirm({
      accept: () => this.props.deleteLanguage(language.key),
      title: `Confirm delete ${language.label}`,
      message: `Are you sure you want to delete ${language.label} language?
      This action may take some time, can not be undone and will delete all the information in that language.`,
      extraConfirm: true });

  }

  addLanguage(language) {
    this.context.confirm({
      accept: () => this.props.addLanguage(language),
      title: `Confirm add ${language.label}`,
      message: 'This action may take some time while we add the extra language to the entire collection.',
      extraConfirm: true,
      type: 'success' });

  }

  render() {
    const currentLanguages = this.props.languages.toJS();
    const currentLanguagesIsos = currentLanguages.map(l => l.key);
    const elasticSupportedIsos = Object.keys(_languagesList.languages).map(k => _languagesList.languages[k].ISO639_1);
    const filteredLanguagesList = _languagesList.allLanguages.filter(l => !currentLanguagesIsos.includes(l.key));
    return (
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Active Languages')),
      _jsx("ul", { className: "list-group document-types" }, void 0,
      currentLanguages.map((language, index) =>
      _jsx("li", { className: "list-group-item" }, index,
      _jsx("span", { className: "force-ltr" }, void 0,
      `${language.label} (${language.key})`),

      language.default ? Languages.defaultLanguage() : '',
      _jsx("div", { className: "list-group-item-actions" }, void 0,
      !language.default ? this.setAsDeafultButton(language) : '',
      !language.default ? this.deleteButton(language) : '')))),




      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Available Languages')),
      _jsx("ul", { className: "list-group document-types" }, void 0,
      filteredLanguagesList.map((language, index) => {
        const notSupported = !elasticSupportedIsos.includes(language.key);
        return (
          _jsx("li", { className: "list-group-item" }, index,
          _jsx("span", { className: "force-ltr" }, void 0,
          `${language.label} (${language.key}) `,
          notSupported ? Languages.notSupportedLanguage() : ''),

          _jsx("div", { className: "list-group-item-actions" }, void 0, "\xA0",
          _jsx("button", { type: "button", onClick: this.addLanguage.bind(this, language), className: "btn btn-success btn-xs template-remove" }, void 0,
          _jsx(_UI.Icon, { icon: "plus" }), "\xA0",
          _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Add language'))))));




      }))));



  }}exports.Languages = Languages;


Languages.contextTypes = {
  confirm: _propTypes.default.func };










function mapStateToProps(state) {
  const { settings, locale } = state;
  return { languages: settings.collection.get('languages'), locale };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    addLanguage: _I18N.actions.addLanguage,
    deleteLanguage: _I18N.actions.deleteLanguage,
    setDefaultLanguage: _I18N.actions.setDefaultLanguage },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Languages);exports.default = _default;