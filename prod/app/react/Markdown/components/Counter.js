"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));

var _markdownDatasets = _interopRequireDefault(require("../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const CounterComponent = ({ count }) => count;

CounterComponent.defaultProps = {
  count: '-' };


CounterComponent.propTypes = {
  count: _propTypes.default.oneOfType([
  _propTypes.default.number,
  _propTypes.default.string]) };



const mapStateToProps = (state, props) => ({
  count: _markdownDatasets.default.getAggregation(state, props) });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(CounterComponent);exports.default = _default;