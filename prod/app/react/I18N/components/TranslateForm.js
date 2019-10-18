"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.TranslateForm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");
var _ = require("./..");
var _Modal = _interopRequireDefault(require("../../Layout/Modal"));
var _Forms = require("../../Forms");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class TranslateForm extends _react.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  submit(values) {
    let translations = this.props.translations.toJS();
    translations = translations.map(t => {
      const { locale } = t;
      const context = t.contexts.find(c => c.id === this.props.context);
      context.values[this.props.value] = values[locale];
      t.contexts = [context];
      return t;
    });
    this.props.saveTranslations(translations);
    this.props.close();
  }

  cancel() {
    this.props.close();
  }

  render() {
    const translations = this.props.translations.toJS();
    const languages = translations.map(t => t.locale);

    return (
      _jsx(_Modal.default, { isOpen: this.props.isOpen, type: "info" }, void 0,
      _jsx(_Modal.default.Body, {}, void 0,
      _jsx("h4", {}, void 0, "Translate"),
      _jsx(_reactReduxForm.Form, { model: "inlineEditModel", onSubmit: this.submit, id: "inlineEdit" }, void 0,
      languages.map((language) =>
      _jsx(_Forms.FormGroup, { model: `.${language}` }, language,
      _jsx(_reactReduxForm.Field, { model: `.${language}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: language }, void 0,
      language,
      _jsx("input", { id: language, className: "form-control" }))))))),







      _jsx(_Modal.default.Footer, {}, void 0,
      _jsx("button", { type: "button", className: "btn btn-default cancel-button", onClick: this.cancel }, void 0, "Cancel"),
      _jsx("button", { type: "submit", form: "inlineEdit", className: "btn confirm-button btn-primary" }, void 0, "Submit"))));




  }}exports.TranslateForm = TranslateForm;


TranslateForm.defaultProps = {
  isOpen: false };











function mapStateToProps(state) {
  return {
    translations: state.translations,
    isOpen: state.inlineEdit.get('showInlineEditForm'),
    context: state.inlineEdit.get('context'),
    value: state.inlineEdit.get('key') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ saveTranslations: _.actions.saveTranslations, close: _.actions.closeInlineEditTranslation }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(TranslateForm);exports.default = _default;