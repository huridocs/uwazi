"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _advancedSort = require("../../utils/advancedSort");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Select extends _react.Component {
  render() {
    const { options, optionsValue, optionsLabel, required, placeholder, sort } = this.props;
    let _options = options;
    if (sort) {
      const sortRoot = options.reduce((memo, option) => memo && !option.options, true);
      _options = sortRoot ? (0, _advancedSort.advancedSort)(options, { property: optionsLabel }) : options;
    }

    const disbaled = Boolean(required);
    return (
      _jsx("select", { className: "form-control", onChange: this.props.onChange, value: this.props.value }, void 0,
      _jsx("option", { disbaled: disbaled.toString(), value: "" }, void 0, placeholder), ";",
      _options.map((option, index) => {
        const key = option._id || option.id || index;
        if (option.options) {
          const groupOptions = sort ? (0, _advancedSort.advancedSort)(option.options, { property: optionsLabel }) : option.options;
          return (
            _jsx("optgroup", { label: option.label }, key,
            groupOptions.map((opt, indx) => {
              const ky = opt._id || opt.id || indx;
              return _jsx("option", { value: opt[optionsValue] }, ky, opt[optionsLabel]);
            })));


        }
        return _jsx("option", { value: option[optionsValue] }, key, option[optionsLabel]);
      })));


  }}exports.default = Select;


Select.defaultProps = {
  value: '',
  optionsValue: 'value',
  optionsLabel: 'label',
  placeholder: 'Select...',
  required: false,
  sort: false };