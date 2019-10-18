"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.ToggleStyleButtons = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _UI = require("../../UI");

var _actions = require("../actions/actions");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ToggleStyleButtons extends _react.Component {
  constructor(props) {
    super(props);
    this.switchView = this.switchView.bind(this);
  }

  switchView(type) {
    return () => {
      this.props.switchView(type);
    };
  }

  render() {
    const { view } = this.props;
    return (
      _jsx("div", { className: "search-list-actions" }, void 0,
      _jsx("button", { onClick: this.switchView('list'), className: `btn ${view !== 'graph' ? 'btn-success' : 'btn-default'}` }, void 0,
      _jsx(_UI.Icon, { icon: "th" })),

      _jsx("button", { onClick: this.switchView('graph'), className: `btn ${view === 'graph' ? 'btn-success' : 'btn-default'}` }, void 0,
      _jsx(_UI.Icon, { icon: "sitemap", transform: { rotate: 270 } }))));



  }}exports.ToggleStyleButtons = ToggleStyleButtons;







function mapStateToProps({ connectionsList }) {
  return {
    view: connectionsList.view };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    switchView: _actions.switchView },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ToggleStyleButtons);exports.default = _default;