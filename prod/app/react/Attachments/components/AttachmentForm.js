"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.AttachmentForm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _reactReduxForm = require("react-redux-form");

var _ReactReduxForms = require("../../ReactReduxForms");
var _languagesList = require("../../../shared/languagesList");
var _t = _interopRequireDefault(require("../../I18N/t"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class AttachmentForm extends _react.Component {
  render() {
    const { model } = this.props;
    const validators = { originalname: { required: val => !!val && val.trim() !== '' } };
    const languageOptions = Object.keys(_languagesList.languages).map(key => ({ value: _languagesList.languages[key].franc, label: _languagesList.languages[key].elastic }));
    languageOptions.push({ value: 'other', label: 'other' });

    return (
      _jsx(_reactReduxForm.Form, { id: "attachmentForm", model: model, onSubmit: this.props.onSubmit, validators: validators }, void 0,
      _jsx(_ReactReduxForms.FormGroup, { model: model, field: "originalname" }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".originalname" }, void 0,
      _jsx("input", { className: "form-control" }))),


      _jsx(_ShowIf.default, { if: this.props.isSourceDocument }, void 0,
      _jsx(_ReactReduxForms.FormGroup, { className: "set-language" }, void 0,
      _jsx("label", {}, void 0, (0, _t.default)('System', 'Language')),
      _jsx(_ReactReduxForms.Select, {
        model: ".language",
        className: "form-control",
        options: languageOptions })))));





  }}exports.AttachmentForm = AttachmentForm;var _default =








(0, _reactRedux.connect)()(AttachmentForm);exports.default = _default;