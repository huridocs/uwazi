"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.I18NLink = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _reactRouter = require("react-router");
var _objectWithoutKeys = _interopRequireDefault(require("../../utils/objectWithoutKeys"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

class I18NLink extends _react.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    if (this.props.disabled) {
      e.preventDefault();
      return;
    }

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }

  render() {
    const props = (0, _objectWithoutKeys.default)(this.props, ['dispatch', 'onClick']);
    return _react.default.createElement(_reactRouter.Link, _extends({ onClick: this.onClick }, props));
  }}exports.I18NLink = I18NLink;


I18NLink.defaultProps = {
  disabled: false,
  onClick: undefined };







function mapStateToProps({ locale }, ownProps) {
  return { to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/') };
}var _default =

(0, _reactRedux.connect)(mapStateToProps)(I18NLink);exports.default = _default;