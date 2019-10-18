"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ConnectionsGroups = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _UI = require("../../UI");

var _I18N = require("../../I18N");

var _ConnectionsGroup = _interopRequireDefault(require("./ConnectionsGroup"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ConnectionsGroups extends _react.Component {
  render() {
    const { connectionsGroups } = this.props;

    let Results =
    _jsx("div", { className: "blank-state" }, void 0,
    _jsx(_UI.Icon, { icon: "exchange-alt" }),
    _jsx("h4", {}, void 0, (0, _I18N.t)('System', 'No Relationships')),
    _jsx("p", {}, void 0, (0, _I18N.t)('System', 'No Relationships description')));



    if (connectionsGroups.size) {
      Results =
      _jsx("div", {}, void 0,
      _jsx("div", { className: "nested-selector" }, void 0,
      _jsx("ul", { className: "multiselect is-active" }, void 0,
      connectionsGroups.map((group) =>
      _jsx(_ConnectionsGroup.default, {

        group: group }, group.get('key'))))));






    }

    return Results;
  }}exports.ConnectionsGroups = ConnectionsGroups;






function mapStateToProps({ relationships }) {
  return {
    connectionsGroups: relationships.list.connectionsGroups };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(ConnectionsGroups);exports.default = _default;