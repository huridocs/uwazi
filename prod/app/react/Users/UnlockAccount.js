"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.UnlockAccount = void 0;var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _reactRouter = require("react-router");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));

var _Auth = _interopRequireDefault(require("../Auth"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class UnlockAccount extends _RouteHandler.default {
  unlockAccount() {
    const { username, code } = this.props.params;
    this.props.unlockAccount({ username, code }).
    then(() => {
      _reactRouter.browserHistory.push('/login');
    }).
    catch(() => {
      _reactRouter.browserHistory.push('/login');
    });
  }

  componentDidMount() {
    this.unlockAccount();
  }

  render() {
    return (
      _jsx("div", { className: "content login-content" }, void 0,
      _jsx("div", { className: "row" }, void 0,
      _jsx("div", { className: "col-xs-12 col-sm-4 col-sm-offset-4 text-center" }, void 0, "Verifying..."))));





  }}exports.UnlockAccount = UnlockAccount;


UnlockAccount.propTypes = {
  unlockAccount: _propTypes.default.func,
  params: _propTypes.default.shape({
    username: _propTypes.default.string,
    code: _propTypes.default.string }) };



function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    unlockAccount: _Auth.default.actions.unlockAccount },
  dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(UnlockAccount);exports.default = _default;