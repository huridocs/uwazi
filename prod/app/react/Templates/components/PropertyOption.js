"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.dragSource = exports.PropertyOption = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactDnd = require("react-dnd");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _UI = require("../../UI");

var _templateActions = require("../actions/templateActions");
var _Icons = _interopRequireDefault(require("./Icons"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class PropertyOption extends _react.Component {
  constructor(props) {
    super(props);
    this.addProperty = this.addProperty.bind(this);
  }

  addProperty() {
    this.props.addProperty({ label: this.props.label, type: this.props.type });
  }

  render() {
    const { connectDragSource } = this.props;
    const { label } = this.props;
    const iconClass = _Icons.default[this.props.type] || 'font';
    const liClass = `list-group-item${this.props.disabled ? ' disabled' : ''}`;
    return (
      connectDragSource(
      _jsx("li", { className: liClass }, void 0,
      _jsx("button", { onClick: this.addProperty }, void 0, _jsx(_UI.Icon, { icon: "plus" })),
      _jsx("span", {}, void 0, _jsx(_UI.Icon, { icon: iconClass }), " ", label))));



  }}exports.PropertyOption = PropertyOption;










const optionSource = {
  beginDrag(props) {
    return Object.assign({}, props);
  },

  canDrag(props) {
    return !props.disabled;
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    if (!dropResult && item.index) {
      props.removeProperty(item.index);
    }
  } };


const dragSource = (0, _reactDnd.DragSource)('METADATA_OPTION', optionSource, connector => ({
  connectDragSource: connector.dragSource() }))(
PropertyOption);exports.dragSource = dragSource;



function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ removeProperty: _templateActions.removeProperty, addProperty: _templateActions.addProperty }, dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps, null, { withRef: true })(dragSource);exports.default = _default;