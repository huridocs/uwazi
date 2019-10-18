"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FormConfigRelationship = void 0;var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ReactReduxForms = require("../../ReactReduxForms");
var _I18N = require("../../I18N");
var _PropertyConfigOptions = _interopRequireDefault(require("./PropertyConfigOptions"));
var _PropertyConfigOption = _interopRequireDefault(require("./PropertyConfigOption"));
var _Tip = _interopRequireDefault(require("../../Layout/Tip"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FormConfigRelationship extends _react.Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const { index, data, formState, type, templates, relationTypes } = this.props;
    const property = data.properties[index];

    const options = templates.toJS().filter(template => template._id !== data._id);
    const labelError = formState.$form.errors[`properties.${index}.label.required`] || formState.$form.errors[`properties.${index}.label.duplicated`];
    const relationTypeError = formState.$form.errors[`properties.${index}.relationType.required`] && formState.$form.submitFailed;
    const inheritPropertyError = formState.$form.errors[`properties.${index}.inheritProperty.required`] && formState.$form.submitFailed;
    const labelClass = labelError ? 'form-group has-error' : 'form-group';
    const template = templates.toJS().find(t => formState.properties[index].content && t._id === formState.properties[index].content.value);
    const templateProperties = template ? template.properties : [];

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: labelClass }, void 0,
      _jsx("label", { htmlFor: "label" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Label")),
      _jsx(_reactReduxForm.Field, { model: `template.data.properties[${index}].label` }, void 0,
      _jsx("input", { id: "label", className: "form-control" }))),


      _jsx("div", { className: relationTypeError ? 'form-group has-error' : 'form-group' }, void 0,
      _jsx("label", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Relationship"), _jsx("span", { className: "required" }, void 0, "*")),
      _jsx(_ReactReduxForms.Select, {
        model: `template.data.properties[${index}].relationType`,
        options: relationTypes.toJS(),
        optionsLabel: "name",
        validators: FormConfigRelationship.contentValidation(),
        optionsValue: "_id" })),


      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Entities")),
      _jsx(_ReactReduxForms.Select, {
        model: `template.data.properties[${index}].content`,
        options: options,
        optionsLabel: "name",
        placeholder: "Any entity or document",
        optionsValue: "_id" })),


      Boolean(formState.properties[index].content && templateProperties.length) &&
      _jsx(_PropertyConfigOption.default, { label: "Inherit property", model: `template.data.properties[${index}].inherit` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will be inherited from the related entities and shown as metadata of this type of entities.")),


      Boolean(formState.properties[index].inherit && formState.properties[index].inherit.value && templateProperties.length) &&
      _jsx("div", { className: inheritPropertyError ? 'form-group has-error' : 'form-group' }, void 0,
      _jsx(_ReactReduxForms.Select, {
        model: `template.data.properties[${index}].inheritProperty`,
        options: templateProperties,
        optionsLabel: "label",
        optionsValue: "_id" })),



      _jsx(_PropertyConfigOptions.default, { index: index, property: property, type: type })));


  }}exports.FormConfigRelationship = FormConfigRelationship;











function mapStateToProps(state) {
  return {
    data: state.template.data,
    templates: state.templates,
    relationTypes: state.relationTypes,
    formState: state.template.formState };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormConfigRelationship);exports.default = _default;