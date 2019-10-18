"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Customisation = void 0;var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _UI = require("../../UI");

var _I18N = require("../../I18N");

var _settingsActions = _interopRequireDefault(require("../actions/settingsActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Customisation extends _react.Component {
  componentDidMount() {
    this.props.loadForm('settings.settings', { customCSS: this.props.settings.get('customCSS') });
  }

  render() {
    return (
      _jsx("div", { className: "panel panel-default settings-custom-css" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Custom styles')),
      _jsx("div", { className: "panel-body" }, void 0,
      _jsx(_reactReduxForm.Form, { model: "settings.settings", onSubmit: this.props.saveSettings }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".customCSS" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "custom_css" }, void 0, (0, _I18N.t)('System', 'Custom CSS'),
      _jsx("textarea", { className: "form-control", id: "custom_css" }))),


      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx("button", { type: "submit", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Update'))))))));






  }}exports.Customisation = Customisation;








const mapStateToProps = state => ({ settings: state.settings.collection });
const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)({
  loadForm: _reactReduxForm.actions.load,
  saveSettings: _settingsActions.default },
dispatch);var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Customisation);exports.default = _default;