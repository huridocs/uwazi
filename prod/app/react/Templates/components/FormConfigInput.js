"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FormConfigInput = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");
var _PropertyConfigOptions = _interopRequireDefault(require("./PropertyConfigOptions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FormConfigInput extends _react.Component {
  render() {
    const { index, property, formState, type, canBeFilter } = this.props;
    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      _jsx("div", {}, void 0,

      _jsx("div", { className: labelClass }, void 0,
      _jsx("label", {}, void 0, "Name"),
      _jsx(_reactReduxForm.Field, { model: `template.data.properties[${index}].label` }, void 0,
      _jsx("input", { className: "form-control" }))),


      _jsx(_PropertyConfigOptions.default, { index: index, property: property, type: type, canBeFilter: canBeFilter })));


  }}exports.FormConfigInput = FormConfigInput;


FormConfigInput.defaultProps = {
  canBeFilter: true };










function mapStateToProps({ template }, props) {
  return {
    property: template.data.properties[props.index],
    formState: template.formState };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormConfigInput);exports.default = _default;