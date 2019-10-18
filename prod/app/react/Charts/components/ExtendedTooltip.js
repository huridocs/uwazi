"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const ExtendedTooltip = props => {
  if (props.active) {
    const dataSetA = props.payload[0];
    const dataSetB = props.payload[1];

    return (
      _jsx("div", { style: { backgroundColor: '#fff', border: '1px solid #ccc' } }, void 0,
      _jsx("div", { style: { backgroundColor: '#eee', borderBottom: '1px dashed #ccc', padding: '5px' } }, void 0,
      dataSetA.payload.name, ":\xA0\xA0",
      _jsx("b", { style: { color: '#600' } }, void 0, dataSetA.value + dataSetB.value)),

      _jsx("div", { style: { padding: '5px' } }, void 0,
      dataSetA.payload.setALabel, ":\xA0\xA0", _jsx("b", { style: { color: '#600' } }, void 0, dataSetA.value), _jsx("br", {}),
      dataSetB.payload.setBLabel, ":\xA0\xA0", _jsx("b", { style: { color: '#600' } }, void 0, dataSetB.value))));



  }
  return null;
};

ExtendedTooltip.defaultProps = {
  payload: [],
  active: false };var _default =







ExtendedTooltip;exports.default = _default;