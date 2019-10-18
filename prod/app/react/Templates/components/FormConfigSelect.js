"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FormConfigSelect = void 0;var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ReactReduxForms = require("../../ReactReduxForms");
var _I18N = require("../../I18N");
var _Layout = require("../../Layout");

var _PropertyConfigOptions = _interopRequireDefault(require("./PropertyConfigOptions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FormConfigSelect extends _react.Component {
  static contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  componentDidMount() {
    this.initialContent = this.props.data.properties[this.props.index].content;
  }

  componentWillReceiveProps(newProps) {
    const newContent = newProps.data.properties[newProps.index].content;
    this.warning = false;
    if (this.initialContent !== newContent) {
      this.warning = true;
    }
  }

  render() {
    const { index, data, formState, type } = this.props;
    const thesauris = this.props.thesauris.toJS();
    const property = data.properties[index];

    const options = thesauris.filter(thesauri => thesauri._id !== data._id && thesauri.type !== 'template');

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    const contentRequiredError = formState.$form.errors[`properties.${index}.content.required`] && formState.$form.submitFailed;
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: labelClass }, void 0,
      _jsx("label", {}, void 0, "Label"),
      _jsx(_reactReduxForm.Field, { model: `template.data.properties[${index}].label` }, void 0,
      _jsx("input", { className: "form-control" }))),



      _jsx("div", { className: contentRequiredError ? 'form-group has-error' : 'form-group' }, void 0,
      _jsx("label", {}, void 0, (0, _I18N.t)('System', 'Select list'), _jsx("span", { className: "required" }, void 0, "*")),
      this.warning &&
      _jsx(_Layout.Warning, { inline: true }, void 0,
      _jsx(_I18N.Translate, {}, void 0, "All entities and documents that have already this property assigned will loose its current value")),




      _jsx(_ReactReduxForms.Select, {
        model: `template.data.properties[${index}].content`,
        options: options,
        optionsLabel: "name",
        optionsValue: "_id" })),



      _jsx(_PropertyConfigOptions.default, { index: index, property: property, type: type })));



  }}exports.FormConfigSelect = FormConfigSelect;











function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    formState: state.template.formState };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormConfigSelect);exports.default = _default;