"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FormConfigCommon = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");

var _PrioritySortingLabel = _interopRequireDefault(require("./PrioritySortingLabel"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FormConfigCommon extends _react.Component {
  getZeroIndex() {
    const { index, data } = this.props;
    const baseZeroIndex = index + data.commonProperties.length;
    return baseZeroIndex;
  }

  renderTitleField() {
    const { index, formState } = this.props;
    let labelClass = 'form-group';
    const labelKey = `commonProperties.${this.getZeroIndex()}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      _jsx("div", { className: labelClass }, void 0,
      _jsx("label", { htmlFor: `label${index}` }, void 0, "Name"),
      _jsx(_reactReduxForm.Field, { model: `template.data.commonProperties[${this.getZeroIndex()}].label` }, void 0,
      _jsx("input", { id: `label${index}`, className: "form-control" }))));



  }

  render() {
    const { index, data } = this.props;
    const property = data.commonProperties[this.getZeroIndex()];

    return (
      _jsx("div", {}, void 0,
      property.name === 'title' &&
      this.renderTitleField(),

      _jsx(_reactReduxForm.Field, { model: `template.data.commonProperties[${this.getZeroIndex()}].prioritySorting` }, void 0,
      _jsx("input", { id: `prioritySorting${index}`, type: "checkbox" }), "\xA0",

      _jsx(_PrioritySortingLabel.default, { htmlFor: `prioritySorting${index}` }))));



  }}exports.FormConfigCommon = FormConfigCommon;








function mapStateToProps({ template }) {
  return {
    data: template.data,
    formState: template.formState };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormConfigCommon);exports.default = _default;