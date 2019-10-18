"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.MarkersComponent = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = _interopRequireDefault(require("immutable"));

var _helper = require("./helper");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const MarkersComponent = ({ children, entities, templates }) => children((0, _helper.getMarkers)(entities, templates));exports.MarkersComponent = MarkersComponent;

MarkersComponent.defaultProps = {
  entities: _immutable.default.List() };


MarkersComponent.propTypes = {
  children: _propTypes.default.func.isRequired,
  templates: _propTypes.default.instanceOf(_immutable.default.List).isRequired,
  entities: _propTypes.default.instanceOf(_immutable.default.List) };


const mapStateToProps = ({ templates }) => ({ templates });exports.mapStateToProps = mapStateToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps)(MarkersComponent);exports.default = _default;