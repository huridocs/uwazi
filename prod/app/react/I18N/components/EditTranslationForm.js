"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.EditTranslationForm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");
var _ = require("./..");
var _Layout = require("../../Layout");
var _UI = require("../../UI");

var _FormGroup = _interopRequireDefault(require("../../DocumentForm/components/FormGroup"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class EditTranslationForm extends _react.Component {
  static getDefaultTranslation(translations, languages) {
    const defaultLocale = languages.find(lang => lang.default).key;
    return translations.find(tr => tr.locale === defaultLocale);
  }

  static translationExists(translations, locale) {
    return translations.find(tr => tr.locale === locale);
  }

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.translationsForm.length !== nextProps.translationsForm.length;
  }

  componentWillUnmount() {
    this.props.resetForm();
  }

  prepareTranslations() {
    const { translationsForm, settings } = this.props;

    if (translationsForm.length) {
      const { languages } = settings.collection.toJS();
      languages.forEach(lang => {
        if (!EditTranslationForm.translationExists(translationsForm, lang.key)) {
          const defaultTranslation = EditTranslationForm.getDefaultTranslation(translationsForm, languages);
          const translation = { locale: lang.key };
          translation.values = Object.assign({}, defaultTranslation.values);
          translationsForm.push(translation);
        }
      });
    }

    return translationsForm;
  }

  save(_translations) {
    const translations = _translations.map(_translationLanguage => {
      const translationLanguage = Object.assign({}, _translationLanguage);
      translationLanguage.contexts = translationLanguage.contexts.filter(ctx => ctx.id === this.props.context);
      return translationLanguage;
    });
    this.props.saveTranslations(translations);
  }

  render() {
    const contextId = this.props.context;
    let defaultTranslationContext = { values: [] };

    const translations = this.prepareTranslations.call(this);
    if (translations.length) {
      defaultTranslationContext = translations[0].contexts.find(ctx => ctx.id === contextId) || defaultTranslationContext;
    }

    const contextKeys = Object.keys(defaultTranslationContext.values);

    const contextName = defaultTranslationContext.label;
    return (
      _jsx("div", { className: "EditTranslationForm" }, void 0,
      _jsx(_reactReduxForm.Form, {
        model: "translationsForm",
        onSubmit: this.save }, void 0,

      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0,
      (0, _.t)('System', 'Translations'), " ", _jsx(_UI.Icon, { icon: "angle-right" }), " ", contextName),

      _jsx("ul", { className: "list-group" }, void 0,
      (() => {
        if (translations.length) {
          return contextKeys.sort().map((value) =>
          _jsx("li", { className: "list-group-item" }, value,
          _jsx("h5", {}, void 0, value),
          translations.map((translation, i) => {
            const context = translation.contexts.find(ctx => ctx.id === contextId);
            const index = translation.contexts.indexOf(context);
            return (
              _jsx(_FormGroup.default, {}, `${translation.locale}-${value}-${i}`,
              _jsx("div", { className: "input-group" }, void 0,
              _jsx("span", { className: "input-group-addon" }, void 0, translation.locale),
              _jsx(_reactReduxForm.Field, { model: ['translationsForm', i, 'contexts', index, 'values', value] }, void 0,
              _jsx("input", { className: "form-control", type: "text" })))));




          })));


        }
      })())),


      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_Layout.BackButton, { to: "/settings/translations" }),
      _jsx("button", { type: "submit", className: "btn btn-success save-template" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _.t)('System', 'Save')))))));





  }}exports.EditTranslationForm = EditTranslationForm;











function mapStateToProps({ translationsForm, translationsFormState, settings }) {
  return {
    translationsForm,
    settings,
    formState: translationsFormState };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ saveTranslations: _.actions.saveTranslations, resetForm: _.actions.resetForm }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(EditTranslationForm);exports.default = _default;