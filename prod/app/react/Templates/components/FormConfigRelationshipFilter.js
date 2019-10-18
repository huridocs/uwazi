"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FormConfigRelationship = void 0;var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ReactReduxForms = require("../../ReactReduxForms");
var _I18N = require("../../I18N");
var _FilterSuggestions = _interopRequireDefault(require("./FilterSuggestions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FormConfigRelationship extends _react.Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const { index, data, formState } = this.props;
    const property = data.properties[index];
    const relationTypes = this.props.relationTypes.toJS();

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    const relationTypeError = formState.$form.errors[`properties.${index}.relationType.required`] && formState.$form.submitFailed;
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: labelClass }, void 0,
      _jsx("label", {}, void 0, "Label"),
      _jsx(_reactReduxForm.Field, { model: `template.data.properties[${index}].label` }, void 0,
      _jsx("input", { className: "form-control" }))),


      _jsx("div", { className: relationTypeError ? 'form-group has-error' : 'form-group' }, void 0,
      _jsx("label", {}, void 0, (0, _I18N.t)('System', 'Relationship type'), _jsx("span", { className: "required" }, void 0, "*")),
      _jsx(_ReactReduxForms.Select, {
        model: `template.data.properties[${index}].relationType`,
        options: relationTypes,
        optionsLabel: "name",
        validators: FormConfigRelationship.contentValidation(),
        optionsValue: "_id" })),



      _jsx("div", {}, void 0,
      _jsx(_reactReduxForm.Field, { className: "filter", model: `template.data.properties[${index}].filter` }, void 0,
      _jsx("input", { id: `filter${this.props.index}`, type: "checkbox", checked: "checked", disabled: true }), "\xA0",

      _jsx("label", { className: "property-label", htmlFor: `filter${this.props.index}` }, void 0, "Use as filter")),



      _react.default.createElement(_FilterSuggestions.default, property))));



  }}exports.FormConfigRelationship = FormConfigRelationship;










function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    relationTypes: state.relationTypes,
    formState: state.template.formState };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormConfigRelationship);exports.default = _default;