"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ContactForm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _I18N = require("../../I18N");
var _api = _interopRequireDefault(require("../../utils/api"));
var _UI = require("../../UI");
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _notificationsActions = require("../../Notifications/actions/notificationsActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ContactForm extends _react.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { name: '', email: '', message: '' };
    this.submit = this.submit.bind(this);
  }

  onChange(key, e) {
    const changedData = {};
    changedData[key] = e.target.value;
    this.setState(changedData);
  }

  submit(e) {
    e.preventDefault();
    _api.default.post('contact', this.state).
    then(() => {
      this.props.notify('Message sent', 'success');
      this.setState({ name: '', email: '', message: '' });
    });
  }

  render() {
    return (
      _jsx("form", { onSubmit: this.submit, className: "contact-form" }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "name" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Name")),
      _jsx("input", { required: true, name: "name", className: "form-control", onChange: this.onChange.bind(this, 'name'), value: this.state.name })),

      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "email" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Email")),
      _jsx("input", { required: true, name: "email", className: "form-control", onChange: this.onChange.bind(this, 'email'), value: this.state.email })),

      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "message" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Message")),
      _jsx("textarea", { required: true, name: "message", className: "form-control", onChange: this.onChange.bind(this, 'message'), value: this.state.message })),

      _jsx("button", { type: "submit", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "paper-plane" }), "\xA0",
      _jsx("span", { className: "btn-label" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Send")))));



  }}exports.ContactForm = ContactForm;






function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ notify: _notificationsActions.notify }, dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(ContactForm);exports.default = _default;