"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.CurrentLocationLink = void 0;var _reactRouter = require("react-router");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));

var _JSONRequest = require("../../shared/JSONRequest");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}

const newParams = (oldQuery, newQuery) => {
  const params = Object.assign({}, oldQuery, newQuery);
  return Object.keys(params).reduce((memo, key) => {
    if (params[key] !== '') {
      return Object.assign(memo, { [key]: params[key] });
    }
    return memo;
  }, {});
};

const validProps = props => {
  const { to } = props,valid = _objectWithoutProperties(props, ["to"]);
  return valid;
};

const CurrentLocationLink = (_ref) => {let { children, location, queryParams } = _ref,otherProps = _objectWithoutProperties(_ref, ["children", "location", "queryParams"]);return (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    _react.default.createElement(_reactRouter.Link, _extends({ to: `${location.pathname}${(0, _JSONRequest.toUrlParams)(newParams(location.query, queryParams))}` }, validProps(otherProps)),
    children));};exports.CurrentLocationLink = CurrentLocationLink;



CurrentLocationLink.defaultProps = {
  children: '',
  queryParams: {} };var _default =
















(0, _reactRouter.withRouter)(CurrentLocationLink);exports.default = _default;