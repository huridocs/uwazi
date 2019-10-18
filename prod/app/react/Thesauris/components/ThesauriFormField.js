"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ThesauriFormField = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactReduxForm = require("react-redux-form");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ThesauriFormField extends _react.Component {
  constructor(props) {
    super(props);
    this.focus = () => {this.groupInput.focus();};
  }

  renderValue(value, index, groupIndex) {
    const { removeValue } = this.props;
    let model = `thesauri.data.values[${index}].label`;
    if (groupIndex !== undefined) {
      model = `thesauri.data.values[${groupIndex}].values[${index}].label`;
    }
    return (
      _jsx("div", {}, `item-${groupIndex || ''}${index}`,
      _jsx(_reactReduxForm.Field, { model: model }, void 0,
      _jsx("input", { className: "form-control", type: "text", placeholder: "Item name" }),
      _jsx("button", {
        tabIndex: index + 500,
        type: "button",
        className: "btn btn-xs btn-danger",
        onClick: removeValue.bind(null, index, groupIndex) }, void 0,

      _jsx(_UI.Icon, { icon: "trash-alt" }), " Delete"))));




  }

  render() {
    const { value, index, groupIndex } = this.props;
    return this.renderValue(value, index, groupIndex);
  }}exports.ThesauriFormField = ThesauriFormField;


ThesauriFormField.defaultProps = {
  groupIndex: undefined };var _default =












ThesauriFormField;exports.default = _default;