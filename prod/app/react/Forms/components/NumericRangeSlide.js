"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class NumericRangeSlide extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value };
    this.onChange = this.onChange.bind(this);
  }

  componentWillReceiveProps({ value }) {
    if (value) {
      this.setState({ value });
    }
  }

  onChange(e) {
    const { value } = e.target;
    this.setState({ value });
    const { delay, onChange } = this.props;
    if (delay) {
      clearTimeout(this.timeOut);
      this.timeOut = setTimeout(() => {
        onChange(value ? parseFloat(value) : null);
      }, delay);

      return;
    }

    onChange(value ? parseFloat(value) : null);
  }

  renderTickMarksDatalist() {
    const { min, max, step, prefix } = this.props;
    return (
      _jsx("datalist", { id: `${prefix}-tickmarks` }, void 0,
      _jsx("option", { value: min }),
      (() => {
        const options = [];
        for (let i = min; i < max; i += step) {
          options.push(_jsx("option", { value: i.toFixed(2) }, i));
        }
        return options;
      })(),
      _jsx("option", { value: max })));


  }

  render() {
    const { min, max, step, prefix, minLabel, maxLabel } = this.props;
    const { value } = this.state;
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("div", { className: "NumericRangeSlide" }, void 0,
      _jsx("input", {
        type: "range",
        list: `${prefix}-tickmarks`,
        min: min,
        max: max,
        step: step,
        onChange: this.onChange,
        value: value }),

      _jsx("div", { className: "NumericRangeSlide-range-labels" }, void 0,
      _jsx("span", {}, void 0, minLabel),
      _jsx("span", {}, void 0, maxLabel))),


      this.renderTickMarksDatalist()));


  }}exports.default = NumericRangeSlide;


NumericRangeSlide.defaultProps = {
  onChange: () => {},
  value: 50,
  step: 5,
  min: 0,
  max: 100,
  prefix: '',
  delay: 0,
  minLabel: '',
  maxLabel: '' };