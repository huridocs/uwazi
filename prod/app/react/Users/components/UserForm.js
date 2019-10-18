"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));

var _I18N = require("../../I18N");
var _reactReduxForm = require("react-redux-form");
var _validator = require("../../Metadata/helpers/validator");
var _Forms = require("../../Forms");
var _Layout = require("../../Layout");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class UserForm extends _react.Component {
  static formGroup(key, label, type = 'text') {
    return (
      _jsx(_Forms.FormGroup, { model: `.${key}` }, void 0,
      _jsx(_reactReduxForm.Field, { model: `.${key}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: key }, void 0,
      _jsx("input", { type: type, id: key, className: "form-control" }),
      label))));




  }

  static footer() {
    const backUrl = '/settings/users';
    return (
      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_Layout.BackButton, { to: backUrl }),
      _jsx("button", { type: "submit", className: "btn btn-success save-template" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save')))));



  }

  static getClassBasedOnRole(role) {
    return `${role === 'admin' ? 'label-success' : 'label-danger'}`;
  }

  static getIconBasedOnRole(role) {
    return `${role === 'admin' ? 'check' : 'times'}`;
  }

  static permissions(role, label) {
    return (
      _jsx("div", { className: "col-sm-6" }, void 0,
      _jsx("div", { className: "well" }, void 0,
      _jsx("label", { htmlFor: role }, void 0,
      _jsx("input", { type: "radio", id: role, name: "role", value: role }), "\xA0",
      (0, _I18N.t)('System', label)),

      _jsx("hr", {}),
      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: "check", className: "label-success" }), "\xA0",
      (0, _I18N.t)('System', 'Upload documents and create entities')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: "check", className: "label-success" }), "\xA0",
      (0, _I18N.t)('System', 'Delete documents and entities')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: "check", className: "label-success" }), "\xA0",
      (0, _I18N.t)('System', 'Apply properties to documents/entities')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: "check", className: "label-success" }), "\xA0",
      (0, _I18N.t)('System', 'Create connections and references')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: "check", className: "label-success" }), "\xA0",
      (0, _I18N.t)('System', 'Create a table of contents')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Manage site settings and configuration')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Add/delete users and assign roles')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Configure filters')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Add/edit translations')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Create document and entity types')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Create dictionaries')),

      _jsx("p", {}, void 0,
      _jsx(_UI.Icon, { icon: UserForm.getIconBasedOnRole(role), className: UserForm.getClassBasedOnRole(role) }), "\xA0",
      (0, _I18N.t)('System', 'Name connections')))));




  }

  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
  }

  submit(user) {
    this.props.submit(user);
  }

  render() {
    const validator = {
      username: { required: _validator.notEmpty },
      email: { required: _validator.notEmpty },
      role: { required: _validator.notEmpty } };

    return (
      _jsx("div", { className: "user-creator" }, void 0,
      _jsx(_reactReduxForm.LocalForm, {
        initialState: this.props.user.toJS(),
        onSubmit: this.props.submit,
        validators: validator }, void 0,

      _jsx("div", { className: "panel-default panel" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0,
      this.props.user.get('username') || 'New User'),

      _jsx("div", { className: "panel-body" }, void 0,
      UserForm.formGroup('username', (0, _I18N.t)('System', 'Username')),
      UserForm.formGroup('email', (0, _I18N.t)('System', 'Email')),
      UserForm.formGroup('password', (0, _I18N.t)('System', 'Password'), 'password'),
      _jsx(_Forms.FormGroup, { model: ".role", className: "form-group-radio" }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".role" }, void 0,
      (0, _I18N.t)('System', 'Role'),
      _jsx("div", { className: "row" }, void 0,
      UserForm.permissions('admin', 'Admin'),
      UserForm.permissions('editor', 'Editor'))))),




      UserForm.footer()))));




  }}


UserForm.defaultProps = {
  user: _immutable.default.fromJS({}) };var _default =







UserForm;exports.default = _default;