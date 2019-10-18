"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.TemplateLabel = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _reselect = require("reselect");
var _colors = require("../utils/colors");
var _t = _interopRequireDefault(require("../I18N/t"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const getTemplateInfo = (0, _reselect.createSelector)(
s => s.templates,
(s, p) => p.template,
(templates, currentTemplate) => {
  let styleProps;
  const name = templates.reduce((result, template, index) => {
    if (template.get('_id') === currentTemplate) {
      styleProps = template.get('color') ?
      { className: 'btn-color', style: { backgroundColor: template.get('color') } } :
      { className: `btn-color btn-color-${index % _colors.COLORS.length}` };
      return template.get('name');
    }
    return result;
  }, '');

  return { name, styleProps };
});


class TemplateLabel extends _react.Component {
  render() {
    const { name, template, className, style } = this.props;
    return (
      _jsx("span", { className: className, style: style }, void 0,
      (0, _t.default)(template, name)));


  }}exports.TemplateLabel = TemplateLabel;


TemplateLabel.defaultProps = {
  className: 'btn-color',
  style: undefined };









const mapStateToProps = (state, props) => {
  const template = getTemplateInfo(state, props);
  return _objectSpread({
    name: template.name,
    template: props.template },
  template.styleProps);

};var _default =

(0, _reactRedux.connect)(mapStateToProps)(TemplateLabel);exports.default = _default;