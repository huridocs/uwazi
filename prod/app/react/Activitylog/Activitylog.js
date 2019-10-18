"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ActivityLog = void 0;var _react = _interopRequireDefault(require("react"));

var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _BasicReducer = require("../BasicReducer");
var _api = _interopRequireDefault(require("../utils/api"));

var _ActivitylogForm = _interopRequireDefault(require("./components/ActivitylogForm"));
var _ActivitylogList = _interopRequireDefault(require("./components/ActivitylogList"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ActivityLog extends _RouteHandler.default {
  static async requestState(requestParams) {
    const logs = await _api.default.get('activitylog', requestParams);
    return [
    _BasicReducer.actions.set('activitylog/search', logs.json),
    _BasicReducer.actions.set('activitylog/list', logs.json.rows)];

  }

  render() {
    return (
      _jsx("div", { className: "activity-log" }, void 0,
      _jsx(_ActivitylogForm.default, {}, void 0,
      _jsx(_ActivitylogList.default, {}))));



  }}exports.ActivityLog = ActivityLog;var _default =


ActivityLog;exports.default = _default;