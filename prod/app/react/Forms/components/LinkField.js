"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class LinkField extends _react.Component {
  constructor(props) {
    super(props);
    this.urlChange = this.urlChange.bind(this);
    this.labelChange = this.labelChange.bind(this);
    this.mapClick = this.mapClick.bind(this);
  }

  onChange(value) {
    this.props.onChange(value);
  }

  urlChange(e) {
    const label = e.target.value;
    this.onChange({ label, url: this.props.value.url });
  }

  labelChange(e) {
    const url = e.target.value;
    this.onChange({ label: this.props.value.label, url });
  }

  mapClick(event) {
    this.onChange({ label: event.lngLat[1], url: event.lngLat[0] });
  }

  render() {
    const { label, url } = this.props.value;

    return (
      _jsx("div", { className: "link form-inline" }, void 0,
      _jsx("div", { className: "form-row" }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", {}, void 0, "Label\xA0"),
      _jsx("input", { onChange: this.urlChange, className: "form-control", id: "label", value: label, step: "any" })),

      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", {}, void 0, "URL\xA0"),
      _jsx("input", { onChange: this.labelChange, className: "form-control", id: "url", value: url, step: "any" })))));




  }}exports.default = LinkField;


LinkField.defaultProps = {
  value: { label: '', url: '' } };