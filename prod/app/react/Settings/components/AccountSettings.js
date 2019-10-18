"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.AccountSettings = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _BasicReducer = require("../../BasicReducer");

var _UsersAPI = _interopRequireDefault(require("../../Users/UsersAPI"));
var _notificationsActions = require("../../Notifications/actions/notificationsActions");
var _RequestParams = require("../../utils/RequestParams");
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class AccountSettings extends _react.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { email: props.user.email || '', password: '', repeatPassword: '' };
  }

  componentWillReceiveProps(props) {
    this.setState({ email: props.user.email || '' });
  }

  emailChange(e) {
    this.setState({ email: e.target.value });
  }

  passwordChange(e) {
    this.setState({ password: e.target.value });
    this.setState({ passwordError: false });
  }

  repeatPasswordChange(e) {
    this.setState({ repeatPassword: e.target.value });
    this.setState({ passwordError: false });
  }

  updateEmail(e) {
    const { email } = this.state;
    const { user, notify, setUser } = this.props;

    e.preventDefault();
    const userData = Object.assign({}, user, { email });
    _UsersAPI.default.save(new _RequestParams.RequestParams(userData)).
    then(result => {
      notify((0, _I18N.t)('System', 'Email updated', null, false), 'success');
      setUser(Object.assign(userData, { _rev: result.rev }));
    });
  }

  updatePassword(e) {
    e.preventDefault();

    const { password, repeatPassword } = this.state;
    const { user, notify, setUser } = this.props;

    const passwordsDontMatch = password !== repeatPassword;
    const emptyPassword = password.trim() === '';
    if (emptyPassword || passwordsDontMatch) {
      this.setState({ passwordError: true });
      return;
    }

    _UsersAPI.default.save(new _RequestParams.RequestParams(Object.assign({}, user, { password }))).
    then(result => {
      notify((0, _I18N.t)('System', 'Password updated', null, false), 'success');
      setUser(Object.assign(user, { _rev: result.rev }));
    });
    this.setState({ password: '', repeatPassword: '' });
  }

  render() {
    const { email, password, repeatPassword, passwordError } = this.state;

    return (
      _jsx("div", { className: "account-settings" }, void 0,
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0,
      (0, _I18N.t)('System', 'Account')),

      _jsx("div", { className: "panel-body" }, void 0,
      _jsx("h5", {}, void 0, (0, _I18N.t)('System', 'Email address')),
      _jsx("form", { onSubmit: this.updateEmail.bind(this) }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "collection_name" }, void 0, (0, _I18N.t)('System', 'Email')),
      _jsx("input", { type: "email", onChange: this.emailChange.bind(this), value: email, className: "form-control" })),

      _jsx("button", { type: "submit", className: "btn btn-success" }, void 0, (0, _I18N.t)('System', 'Update'))),

      _jsx("hr", {}),
      _jsx("h5", {}, void 0, (0, _I18N.t)('System', 'Change password')),
      _jsx("form", { onSubmit: this.updatePassword.bind(this) }, void 0,
      _jsx("div", { className: `form-group${passwordError ? ' has-error' : ''}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "password" }, void 0, (0, _I18N.t)('System', 'New password')),
      _jsx("input", {
        type: "password",
        onChange: this.passwordChange.bind(this),
        value: password,
        id: "password",
        className: "form-control" })),


      _jsx("div", { className: `form-group${passwordError ? ' has-error' : ''}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "repeatPassword" }, void 0, (0, _I18N.t)('System', 'Confirm new password')),
      _jsx("input", {
        type: "password",
        onChange: this.repeatPasswordChange.bind(this),
        value: repeatPassword,
        id: "repeatPassword",
        className: "form-control" })),


      passwordError &&
      _jsx("div", { className: "validation-error validation-error-centered" }, void 0,
      _jsx(_UI.Icon, { icon: "exclamation-triangle" }), "\xA0",

      (0, _I18N.t)('System', 'Password Error')),


      _jsx("button", { type: "submit", className: "btn btn-success" }, void 0, (0, _I18N.t)('System', 'Update'))))),



      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx("a", { href: "/logout", className: "btn btn-danger" }, void 0,
      _jsx(_UI.Icon, { icon: "power-off" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Logout'))))));




  }}exports.AccountSettings = AccountSettings;


AccountSettings.defaultProps = {
  user: {} };








function mapStateToProps(state) {
  return { user: state.user.toJS() };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ setUser: _BasicReducer.actions.set.bind(null, 'auth/user'), notify: _notificationsActions.notify }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(AccountSettings);exports.default = _default;