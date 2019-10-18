"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.Login = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactRouter = require("react-router");
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");

var _I18N = require("../I18N");
var _socket = require("../socket");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _ShowIf = _interopRequireDefault(require("../App/ShowIf"));
var _thesaurisActions = require("../Thesauris/actions/thesaurisActions");

var _Auth = _interopRequireDefault(require("../Auth"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const reloadHome = () => {
  window.location.reload();
};

class Login extends _RouteHandler.default {
  constructor(props, context) {
    super(props, context);
    this.state = { error: false, recoverPassword: false };
    this.submit = this.submit.bind(this);
  }

  submit(credentials) {
    if (this.state.recoverPassword) {
      return this.recoverPassword(credentials.username);
    }

    return this.login(credentials);
  }

  recoverPassword(email) {
    this.setState({ recoverPassword: false, error: false });
    this.props.reset('login.form');
    return this.props.recoverPassword(email);
  }

  login(credentials) {
    return this.props.login(credentials).
    then(() => {
      if (this.props.private) {
        _reactRouter.browserHistory.push('/');
        reloadHome();
        return;
      }
      (0, _socket.reconnectSocket)();
      this.props.reloadThesauris();
      _reactRouter.browserHistory.push('/');
    }).
    catch(() => {
      this.setState({ error: true });
    });
  }

  setRecoverPassword() {
    this.props.reset('login.form');
    this.setState({ recoverPassword: true, error: false });
  }

  setLogin() {
    this.props.reset('login.form');
    this.setState({ recoverPassword: false, error: false });
  }

  render() {
    return (
      _jsx("div", { className: "content login-content" }, void 0,
      _jsx("div", { className: "row" }, void 0,
      _jsx("div", { className: "col-xs-12 col-sm-4 col-sm-offset-4" }, void 0,
      _jsx("h1", { className: "login-title" }, void 0,
      _jsx("img", { src: "/public/logo.svg", title: "uwazi", alt: "uwazi" })),

      _jsx(_reactReduxForm.Form, { onSubmit: this.submit, model: "login.form" }, void 0,
      _jsx("div", { className: `form-group login-email${this.state.error ? ' has-error' : ''}` }, void 0,
      _jsx(_reactReduxForm.Field, { model: "login.form.username" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "username" }, void 0,
      this.state.recoverPassword ? (0, _I18N.t)('System', 'Email') : (0, _I18N.t)('System', 'User')),

      _jsx("input", { type: "text", name: "username", id: "username", className: "form-control" }))),


      _jsx("div", { className: `form-group login-password ${this.state.error ? 'has-error' : ''}${this.state.recoverPassword ? ' is-hidden' : ''}` }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "password" }, void 0, (0, _I18N.t)('System', 'Password')),
      _jsx(_reactReduxForm.Field, { model: "login.form.password" }, void 0,
      _jsx("input", { type: "password", name: "password", id: "password", className: "form-control" })),

      _jsx("div", { className: "form-text" }, void 0,
      this.state.error && _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Login failed'), " - "),
      _jsx("a", {
        title: (0, _I18N.t)('System', 'Forgot Password?', null, false),
        onClick: this.setRecoverPassword.bind(this),
        className: this.state.error ? 'label-danger' : '' }, void 0,

      (0, _I18N.t)('System', 'Forgot Password?')))),



      _jsx("p", {}, void 0,
      _jsx("button", { type: "submit", className: `btn btn-block btn-lg ${this.state.recoverPassword ? 'btn-success' : 'btn-primary'}` }, void 0,
      this.state.recoverPassword ? (0, _I18N.t)('System', 'Send recovery email') : (0, _I18N.t)('System', 'Login button', 'Login'))),


      _jsx(_ShowIf.default, { if: this.state.recoverPassword }, void 0,
      _jsx("div", { className: "form-text" }, void 0,
      _jsx("a", {
        title: (0, _I18N.t)('System', 'Cancel', null, false),
        onClick: this.setLogin.bind(this) }, void 0,

      (0, _I18N.t)('System', 'Cancel')))))))));








  }}exports.Login = Login;


Login.propTypes = {
  login: _propTypes.default.func,
  recoverPassword: _propTypes.default.func,
  reloadThesauris: _propTypes.default.func };


function mapStateToProps({ settings }) {
  return {
    private: settings.collection.get('private') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    login: _Auth.default.actions.login,
    recoverPassword: _Auth.default.actions.recoverPassword,
    reset: _reactReduxForm.actions.reset,
    reloadThesauris: _thesaurisActions.reloadThesauris },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Login);exports.default = _default;