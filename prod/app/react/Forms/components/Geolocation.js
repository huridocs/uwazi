"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _Map = _interopRequireDefault(require("../../Map/Map"));
var _I18N = require("../../I18N");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const defaultValue = { lat: '', lon: '', label: '' };

function isCoordinateValid(coord) {
  return typeof coord === 'number' && !Number.isNaN(coord);
}

class Geolocation extends _react.Component {
  constructor(props) {
    super(props);
    this.latChange = this.latChange.bind(this);
    this.lonChange = this.lonChange.bind(this);
    this.mapClick = this.mapClick.bind(this);
    this.clearCoordinates = this.clearCoordinates.bind(this);

    const { lat, lon } = this.getInputValues();

    this.state = {
      currentLatitude: lat,
      currentLongitude: lon };

  }

  onChange(newValue) {
    this.setState({ currentLatitude: newValue.lat, currentLongitude: newValue.lon });
    const { onChange, value } = this.props;
    if (!isCoordinateValid(newValue.lat) || !isCoordinateValid(newValue.lon)) {
      onChange();
      return;
    }
    const valueToSend = value.slice(1);
    valueToSend.unshift(newValue);

    onChange(valueToSend);
  }

  getInputValues() {
    const { value } = this.props;
    const { lat, lon, label } = value && value[0] ? value[0] : _objectSpread({}, defaultValue);
    return { lat, lon, label };
  }

  latChange(e) {
    let latitude = e.target.value ? parseFloat(e.target.value) : '';
    latitude = latitude && latitude < -89.99999 ? -89.99999 : latitude;
    latitude = latitude && latitude > 90 ? 90 : latitude;

    const { label } = this.getInputValues();
    const { currentLongitude } = this.state;
    this.onChange({ lat: latitude, lon: currentLongitude, label });
  }

  lonChange(e) {
    const longitude = e.target.value ? parseFloat(e.target.value) : '';

    const { label } = this.getInputValues();
    const { currentLatitude } = this.state;
    this.onChange({ lat: currentLatitude, lon: longitude, label });
  }

  mapClick(event) {
    const { label } = this.getInputValues();
    this.onChange({ lat: parseFloat(event.lngLat[1]), lon: parseFloat(event.lngLat[0]), label });
  }

  clearCoordinates() {
    this.setState({ currentLatitude: '', currentLongitude: '' });
    const { onChange } = this.props;
    onChange();
  }

  render() {
    const { currentLatitude, currentLongitude } = this.state;
    const markers = [];

    if (isCoordinateValid(currentLatitude) && isCoordinateValid(currentLongitude)) {
      markers.push({ latitude: parseFloat(currentLatitude), longitude: parseFloat(currentLongitude) });
    }

    return (
      _jsx("div", { className: "geolocation form-inline" }, void 0,
      _jsx(_Map.default, { markers: markers, onClick: this.mapClick, height: 370, autoCenter: false }),
      _jsx("div", { className: "form-row" }, void 0,
      _jsx("div", { className: "form-group half-width" }, void 0,
      _jsx("label", {}, void 0, "Latitude"),
      _jsx("input", {
        onChange: this.latChange,
        className: "form-control",
        type: "number",
        id: "lat",
        value: currentLatitude,
        step: "any" })),


      _jsx("div", { className: "form-group half-width" }, void 0,
      _jsx("label", {}, void 0, "Longitude"),
      _jsx("input", {
        onChange: this.lonChange,
        className: "form-control",
        type: "number",
        id: "lon",
        value: currentLongitude,
        step: "any" }))),



      (currentLatitude || currentLongitude) &&
      _jsx("div", { className: "clear-field-button" }, void 0,
      _jsx("button", { type: "button", onClick: this.clearCoordinates }, void 0,
      _jsx(_I18N.Translate, {}, void 0, "Clear coordinates")))));





  }}exports.default = Geolocation;


Geolocation.defaultProps = {
  value: [_objectSpread({}, defaultValue)] };