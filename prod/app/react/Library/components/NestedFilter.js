"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ReactReduxForms = require("../../ReactReduxForms");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class NestedFilter extends _react.Component {
  render() {
    const { onChange, model, label, property, aggregations } = this.props;
    return (
      _jsx("ul", { className: "search__filter is-active" }, void 0,
      _jsx("li", {}, void 0,
      _jsx("label", {}, void 0, label),
      _jsx("div", { className: "nested-strict" }, void 0,
      _jsx(_reactReduxForm.Field, { model: `${model}.strict` }, void 0,
      _jsx("input", {
        id: `${model}strict`,
        type: "checkbox",
        onChange: onChange })),


      _jsx("label", { htmlFor: `${model}strict` }, void 0,
      _jsx("span", {}, void 0, "\xA0Strict mode")))),



      _jsx("li", { className: "wide" }, void 0,
      _jsx(_ReactReduxForms.NestedMultiselect, {
        aggregations: aggregations,
        property: property,
        onChange: onChange }))));




  }}


NestedFilter.defaultProps = {
  onChange: () => {},
  label: '',
  aggregations: _immutable.default.Map() };var _default =













NestedFilter;exports.default = _default;