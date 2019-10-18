"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = require("react");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class MockProvider extends _react.Component {
  getChildContext() {
    const { props } = this;
    return {
      getInitialData() {
        return props.initialData;
      },
      isRenderedFromServer() {
        return false;
      },
      getUser() {
        return props.user;
      },
      router: props.router };

  }

  render() {
    const { children } = this.props;
    return _react.Children.only(children);
  }}


MockProvider.childContextTypes = {
  getInitialData: _propTypes.default.func,
  isRenderedFromServer: _propTypes.default.func,
  getUser: _propTypes.default.func,
  router: _propTypes.default.object };var _default =






MockProvider;exports.default = _default;