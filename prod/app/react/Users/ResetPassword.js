"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _reactRouter = require("react-router");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _queryString = _interopRequireDefault(require("query-string"));
var _UI = require("../UI");

var _Auth = _interopRequireDefault(require("../Auth"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ResetPassword extends _RouteHandler.default {
  constructor(props, context) {
    super(props, context);
    this.state = { error: false, password: '', repeatPassword: '' };
    this.submit = this.submit.bind(this);
    this.passwordChange = this.passwordChange.bind(this);
    this.repeatPasswordChange = this.repeatPasswordChange.bind(this);
  }

  passwordChange(e) {
    this.setState({ password: e.target.value });
    this.setState({ passwordError: false });
  }

  repeatPasswordChange(e) {
    this.setState({ repeatPassword: e.target.value });
    this.setState({ passwordError: false });
  }

  submit(e) {
    e.preventDefault();
    const passwordsDontMatch = this.state.password !== this.state.repeatPassword;
    const emptyPassword = this.state.password.trim() === '';
    if (emptyPassword || passwordsDontMatch) {
      this.setState({ error: true });
      return;
    }

    this.props.resetPassword(this.state.password, this.props.params.key).
    then(() => {
      _reactRouter.browserHistory.push('/login');
    });

    this.setState({ password: '', repeatPassword: '' });
  }


  render() {
    return (
      _jsx("div", { className: "content login-content" }, void 0,
      _jsx("div", { className: "row" }, void 0,
      _jsx("div", { className: "col-xs-12 col-sm-4 col-sm-offset-4" }, void 0,

      _queryString.default.parse(this.context.router.location.search).createAccount === 'true' &&
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle" }),
      _jsx("div", {}, void 0, "To complete the account creation process, please create a password for your account")),


      _jsx("form", { onSubmit: this.submit }, void 0,
      _jsx("div", { className: `form-group login-email ${this.state.error ? 'has-error' : ''}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "password" }, void 0, "Password"),
      _jsx("input", {
        onChange: this.passwordChange,
        value: this.state.password,
        type: "password",
        name: "password",
        id: "password",
        className: "form-control" })),


      _jsx("div", { className: `form-group login-password ${this.state.error ? 'has-error' : ''}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "repeat-password" }, void 0, "Repeat Password"),
      _jsx("input", {
        value: this.state.repeatPassword,
        onChange: this.repeatPasswordChange,
        type: "password",
        name: "repeat-password",
        id: "repeat-password",
        className: "form-control" }),

      this.state.error && _jsx("div", { className: "required" }, void 0, "Passwords don\u2019t match")),

      _jsx("button", { type: "submit", className: "btn btn-block btn-lg btn-primary" }, void 0, "Save password"))))));







  }}


ResetPassword.propTypes = {
  resetPassword: _propTypes.default.func,
  params: _propTypes.default.shape({
    key: _propTypes.default.string }) };



function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ resetPassword: _Auth.default.actions.resetPassword }, dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(ResetPassword);exports.default = _default;