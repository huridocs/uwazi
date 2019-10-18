"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = require("react");
var _propTypes = _interopRequireDefault(require("prop-types"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class Script extends _react.Component {
  componentDidMount() {
    this.appendScript();
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    if (children !== prevProps.children) {
      this.appendScript();
    }
  }

  appendScript() {
    const { children } = this.props;
    if (children) {
      const s = document.createElement('script');
      s.src = `data:text/javascript,(function(){${encodeURIComponent(`\n\n${children}\n\n`)}})()`;
      document.body.appendChild(s);
    }
  }

  render() {
    return null;
  }}


Script.defaultProps = {
  children: '' };var _default =






Script;exports.default = _default;