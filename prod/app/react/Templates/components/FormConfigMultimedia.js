"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactReduxForm = require("react-redux-form");
var _reactRedux = require("react-redux");

var _I18N = require("../../I18N");
var _ReactReduxForms = require("../../ReactReduxForms");
var _Tip = _interopRequireDefault(require("../../Layout/Tip"));

var _PropertyConfigOption = _interopRequireDefault(require("./PropertyConfigOption"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const style = (index) =>
_jsx("div", {}, void 0,
_jsx("div", { className: "form-group" }, void 0,
_jsx("label", {}, void 0,
(0, _I18N.t)('System', 'Style')),

_jsx(_ReactReduxForms.Select, {
  model: `template.data.properties[${index}].style`,
  options: [{ _id: 'contain', name: 'Fit' }, { _id: 'cover', name: 'Fill' }],
  optionsLabel: "name",
  optionsValue: "_id" })),


_jsx("div", { className: "protip" }, void 0,
_jsx("p", {}, void 0,
_jsx("b", {}, void 0, "Fit"), " will show the entire media inside the container.",
_jsx("br", {}),
_jsx("b", {}, void 0, "Fill"), " will attempt to fill the container, using it's entire width.  In cards, cropping is likely to occur.")));





class FormConfigMultimedia extends _react.Component {
  render() {
    const { index, formState, canShowInCard, helpText, canSetStyle, canBeRequired } = this.props;

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



      helpText &&
      _jsx("div", { className: "protip" }, void 0,
      _jsx("i", { className: "fa fa-lightbulb-o" }),
      _jsx("span", {}, void 0, helpText)),



      _jsx(_PropertyConfigOption.default, { label: "Hide label", model: `template.data.properties[${index}].noLabel` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will be shown without the label.")),

      _jsx(_PropertyConfigOption.default, { label: "Full width", model: `template.data.properties[${index}].fullWidth` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will be shown using all the width available.")),

      canBeRequired &&
      _jsx(_PropertyConfigOption.default, { label: "Required property", model: `template.data.properties[${index}].required` }, void 0,
      _jsx(_Tip.default, {}, void 0, "You won't be able to save a document if this property is empty.")),


      canShowInCard &&
      _jsx(_PropertyConfigOption.default, { label: "Show in cards", model: `template.data.properties[${index}].showInCard` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will appear in the library cards as part of the basic info.")),



      canSetStyle && style(index)));


  }}


FormConfigMultimedia.defaultProps = {
  canShowInCard: true,
  canSetStyle: true,
  canBeRequired: true,
  helpText: '' };











function mapStateToProps({ template }) {
  return {
    formState: template.formState };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FormConfigMultimedia);exports.default = _default;