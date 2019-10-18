"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.mapStateToProps = void 0;var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = _interopRequireDefault(require("immutable"));
var _Metadata = require("../../Metadata");
var _reactReduxForm = require("react-redux-form");
var _ReactReduxForms = require("../../ReactReduxForms");
var _I18N = require("../../I18N");
var _uploadsActions = require("../../Uploads/actions/uploadsActions");
var _redux = require("redux");
var _Forms = require("../../Forms");
var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class PublicForm extends _react.Component {
  static renderTitle() {
    return (
      _jsx(_Forms.FormGroup, { model: ".title" }, "title",
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("li", {}, void 0,
      _jsx("label", { htmlFor: "title" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Title"), _jsx("span", { className: "required" }, void 0, "*"))),

      _jsx("li", { className: "wide" }, void 0,
      _jsx(_reactReduxForm.Control.text, { id: "title", className: "form-control", model: ".title" })))));




  }

  static renderSubmitState() {
    return (
      _jsx("div", { className: "public-form submiting" }, void 0,
      _jsx("h3", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Submiting")),
      _jsx(_Loader.default, {})));


  }

  static renderFileField(id, options) {
    const defaults = { className: 'form-control', model: `.${id}` };
    const props = Object.assign(defaults, options);
    return (
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("li", {}, void 0,
      _jsx("label", { htmlFor: id }, void 0,
      _jsx(_I18N.Translate, {}, void 0, id === 'file' ? 'Document' : 'Attachments'),
      _react.default.createElement(_reactReduxForm.Control.file, _extends({ id: id }, props)))))));





  }

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validators = Object.assign({ captcha: { required: val => val && val.length } }, _Metadata.validator.generate(props.template.toJS()));
    this.state = { submiting: false };
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetForm() {
    this.formDispatch(_reactReduxForm.actions.reset('publicform'));
  }

  handleSubmit(_values) {
    const values = _objectSpread({}, _values);
    const { submit, template, remote } = this.props;
    values.file = _values.file ? _values.file[0] : undefined;
    values.template = template.get('_id');

    submit(values, remote).then(uploadCompletePromise => {
      this.setState({ submiting: true });
      return uploadCompletePromise.promise.then(() => {
        this.setState({ submiting: false });
        this.resetForm();
        this.refreshCaptcha();
      }).catch(() => {
        this.setState({ submiting: false });
        this.refreshCaptcha();
      });
    }).catch(() => {
      this.setState({ submiting: false });
      this.refreshCaptcha();
    });
  }

  renderCaptcha() {
    const { remote } = this.props;
    return (
      _jsx(_Forms.FormGroup, { model: ".captcha" }, "captcha",
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("li", {}, void 0, _jsx("label", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Captcha"), _jsx("span", { className: "required" }, void 0, "*"))),
      _jsx("li", { className: "wide" }, void 0,
      _jsx(_ReactReduxForms.Captcha, { remote: remote, refresh: refresh => {this.refreshCaptcha = refresh;}, model: ".captcha" })))));




  }

  render() {
    const { template, thesauris, file, attachments } = this.props;
    const { submiting } = this.state;
    return (
      _jsx(_reactReduxForm.LocalForm, {
        validators: this.validators,
        model: "publicform",
        getDispatch: dispatch => this.attachDispatch(dispatch),
        onSubmit: this.handleSubmit }, void 0,

      submiting ? PublicForm.renderSubmitState() :
      _jsx("div", { className: "public-form" }, void 0,
      PublicForm.renderTitle(),
      _jsx(_Metadata.MetadataFormFields, { thesauris: thesauris, model: "publicform", template: template }),
      file ? PublicForm.renderFileField('file', { accept: '.pdf' }) : false,
      attachments ? PublicForm.renderFileField('attachments', { multiple: 'multiple' }) : false,
      this.renderCaptcha(),
      _jsx("input", { type: "submit", className: "btn btn-success", value: "Submit" }))));




  }}











const mapStateToProps = (state, props) => ({
  template: state.templates.find(template => template.get('_id') === props.template),
  thesauris: state.thesauris,
  file: props.file !== undefined,
  remote: props.remote !== undefined,
  attachments: props.attachments !== undefined });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ submit: _uploadsActions.publicSubmit }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(PublicForm);exports.default = _default;