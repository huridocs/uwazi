"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.NeedAuthorization = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = require("react");
var _reactRedux = require("react-redux");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class NeedAuthorization extends _react.Component {
  render() {
    if (!this.props.authorized) {
      return false;
    }

    return this.props.children;
  }}exports.NeedAuthorization = NeedAuthorization;








function mapStateToProps({ user }, props) {
  const roles = props.roles || ['admin'];
  return {
    authorized: !!(user.get('_id') && roles.includes(user.get('role'))) };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(NeedAuthorization);exports.default = _default;