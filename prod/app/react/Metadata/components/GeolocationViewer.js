"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _formatcoords = _interopRequireDefault(require("formatcoords"));

var _Map = require("../../Map");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const GeolocationViewer = ({ points, onlyForCards }) => {
  if (onlyForCards) {
    return (
      _jsx("div", {}, void 0,
      points.filter(p => Boolean(p)).map((p, i) => {
        const coords = (0, _formatcoords.default)(p.lat, p.lon);
        return _jsx("div", {}, i, p.label ? `${p.label}: ` : '', coords.format('DD MM ss X', { latLonSeparator: ', ', decimalPlaces: 0 }));
      })));


  }

  const markers = [];
  points.filter(p => Boolean(p)).forEach(({ lat, lon, label }) => {
    markers.push({ latitude: lat, longitude: lon, properties: { info: label } });
  });

  const componentProps = markers.length ? { latitude: markers[0].latitude, longitude: markers[0].longitude } : {};

  return _react.default.createElement(_Map.Map, _extends({}, componentProps, { height: 370, markers: markers }));
};

GeolocationViewer.defaultProps = {
  points: [],
  onlyForCards: true };var _default =







GeolocationViewer;exports.default = _default;