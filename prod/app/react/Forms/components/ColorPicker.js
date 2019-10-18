"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactColor = require("react-color");

var _colors = require("../../utils/colors");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ColorPicker extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { active: false };
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onColorChange = this.onColorChange.bind(this);
  }

  onColorChange({ hex }) {
    const { onChange } = this.props;
    onChange(hex);
  }

  onButtonClick() {
    this.setState(oldState => ({ active: !oldState.active }));
  }

  onBlur() {
    this.setState({ active: false });
  }

  render() {
    const { active } = this.state;
    const { value, defaultValue } = this.props;
    return (
      _jsx("div", { className: "ColorPicker" }, void 0,
      _jsx("div", {
        className: "ColorPicker__button",
        style: { backgroundColor: value || defaultValue },
        onClick: this.onButtonClick }),

      active &&
      _jsx("div", { className: "ColorPicker__popover" }, void 0,
      _jsx("div", { className: "ColorPicker__cover", onClick: this.onBlur }),
      _jsx(_reactColor.TwitterPicker, {
        color: value || defaultValue,
        colors: _colors.COLORS,
        onChangeComplete: this.onColorChange }))));





  }}


ColorPicker.defaultProps = {
  value: '',
  defaultValue: '' };var _default =








ColorPicker;exports.default = _default;