"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FormConfigNested = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _templateActions = require("../actions/templateActions");
var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _UI = require("../../UI");
var _ViolatedArticlesNestedProperties = _interopRequireDefault(require("./ViolatedArticlesNestedProperties"));
var _PropertyConfigOptions = _interopRequireDefault(require("./PropertyConfigOptions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FormConfigNested extends _react.Component {
  constructor(props) {
    super(props);
    props.setNestedProperties(props.index, Object.keys(_ViolatedArticlesNestedProperties.default));
  }

  contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  render() {
    const { index, data, formState, type } = this.props;
    const property = data.properties[index];

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
      _jsx("label", {}, void 0, "Label"),
      _jsx(_reactReduxForm.Field, { model: `template.data.properties[${index}].label` }, void 0,
      _jsx("input", { className: "form-control" }))),



      _jsx(_reactReduxForm.Field, { model: `template.data.properties[${index}].required` }, void 0,
      _jsx("input", { id: `required${this.props.index}`, type: "checkbox" }), "\xA0",

      _jsx("label", { className: "property-label", htmlFor: `required${this.props.index}` }, void 0, "Required property",

      _jsx("span", { className: "property-help" }, void 0,
      _jsx(_UI.Icon, { icon: "question-circle" }),
      _jsx("div", { className: "property-description" }, void 0, "You won't be able to publish a document if this property is empty.")))),



      _jsx(_PropertyConfigOptions.default, { index: index, property: property, type: type })));


  }}exports.FormConfigNested = FormConfigNested;












function mapStateToProps(state) {
  return {
    data: state.template.data,
    formState: state.template.formState };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ setNestedProperties: _templateActions.setNestedProperties }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(FormConfigNested);exports.default = _default;