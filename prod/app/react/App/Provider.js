"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = require("react");
var _propTypes = _interopRequireDefault(require("prop-types"));

var _utils = require("../utils");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class CustomProvider extends _react.Component {
  constructor(props) {
    super(props);
    this.data = _utils.isClient && window.__reduxData__ ? window.__reduxData__ : props.initialData;
    this.renderedFromServer = true;
    this.user = _utils.isClient && window.__user__ ? window.__user__ : props.user;
  }

  getChildContext() {
    return {
      getInitialData: this.getInitialData.bind(this),
      isRenderedFromServer: this.isRenderedFromServer.bind(this),
      getUser: this.getUser.bind(this),
      language: this.props.language };

  }

  getUser() {
    return this.user;
  }

  isRenderedFromServer() {
    const { renderedFromServer } = this;
    this.renderedFromServer = false;
    return renderedFromServer;
  }

  getInitialData() {
    const { data } = this;
    delete this.data;
    return data;
  }

  render() {
    const { children } = this.props;
    return _react.Children.only(children);
  }}









CustomProvider.childContextTypes = {
  getInitialData: _propTypes.default.func,
  isRenderedFromServer: _propTypes.default.func,
  getUser: _propTypes.default.func,
  language: _propTypes.default.string };var _default =


CustomProvider;exports.default = _default;