"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");

var _reactFontawesome = require("@fortawesome/react-fontawesome");
var _languagesList = require("../../../shared/languagesList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}

const Icon = (_ref) => {let { locale, directionAware } = _ref,ownProps = _objectWithoutProperties(_ref, ["locale", "directionAware"]);
  const languageData = _languagesList.allLanguages.find(l => l.key === locale);
  return (
    _react.default.createElement(_reactFontawesome.FontAwesomeIcon, _extends({},
    ownProps, {
      flip: languageData && languageData.rtl ? 'horizontal' : null })));


};

Icon.defaultProps = {
  locale: '',
  directionAware: false };







const mapStateToProps = ({ locale }) => ({ locale });exports.mapStateToProps = mapStateToProps;var _default =

(0, _reactRedux.connect)(
mapStateToProps,
() => ({}))(
Icon);exports.default = _default;