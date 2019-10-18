"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class RadioButtons extends _react.Component {
  change(value) {
    this.props.onChange(value);
  }

  checked(value) {
    return value === this.props.value;
  }

  renderLabel(opt) {
    if (this.props.renderLabel) {
      return this.props.renderLabel(opt);
    }

    const { optionsLabel } = this.props;
    return opt[optionsLabel];
  }

  render() {
    const { optionsValue, prefix, options } = this.props;

    return (
      _jsx("div", {}, void 0,
      options.map((option) =>
      _jsx("div", { className: "radio" }, option[optionsValue],
      _jsx("label", { htmlFor: prefix + option[optionsValue] }, void 0,
      _jsx("input", {
        type: "radio",
        value: option[optionsValue],
        id: prefix + option[optionsValue],
        onChange: this.change.bind(this, option[optionsValue]),
        checked: this.checked(option[optionsValue]) }),

      _jsx("span", { className: "multiselectItem-name" }, void 0,
      this.renderLabel(option)))))));






  }}exports.default = RadioButtons;


RadioButtons.defaultProps = {
  optionsLabel: 'label',
  optionsValue: 'value',
  prefix: '',
  renderLabel: undefined };