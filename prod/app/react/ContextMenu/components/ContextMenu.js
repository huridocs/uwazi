"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ContextMenu = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _contextMenuActions = require("../actions/contextMenuActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ContextMenu extends _react.Component {
  render() {
    const children = _react.default.Children.map(this.props.children, child => child) || [];
    let SubMenu = children.filter(child => {
      const forceShow = this.props.overrideShow && this.props.show;
      const matchesType = child.type.name === this.props.type;
      const matchesWrap = child.type.WrappedComponent && child.type.WrappedComponent.name === this.props.type;
      return forceShow || matchesType || matchesWrap;
    });

    const position = `ContextMenu-${this.props.align || 'bottom'}`;

    SubMenu = _react.default.Children.map(SubMenu, child => _react.default.cloneElement(child, { active: this.props.open }));

    return (
      _jsx("div", {
        className: `ContextMenu ${position}`,
        onMouseEnter: this.props.openMenu,
        onMouseLeave: this.props.closeMenu,
        onClick: this.props.closeMenu }, void 0,

      SubMenu));


  }}exports.ContextMenu = ContextMenu;


















const mapStateToProps = state => state.contextMenu.toJS();

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ openMenu: _contextMenuActions.openMenu, closeMenu: _contextMenuActions.closeMenu }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ContextMenu);exports.default = _default;