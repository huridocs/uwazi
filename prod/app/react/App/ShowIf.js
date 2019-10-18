"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ShowIf = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = require("react");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class ShowIf extends _react.Component {
  render() {
    if (!this.props.if) {
      return false;
    }

    return this.props.children;
  }}exports.ShowIf = ShowIf;var _default =








ShowIf;exports.default = _default;