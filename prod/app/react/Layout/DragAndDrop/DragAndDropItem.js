"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.DragAndDropItem = exports.itemTarget = exports.itemSource = void 0;var _reactDnd = require("react-dnd");
var _reactDom = require("react-dom");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");

var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const itemSource = {
  beginDrag(props) {
    return {
      id: props.id,
      name: props.name,
      items: props.items,
      container: props.container,
      index: props.index,
      originalItem: props.originalItem };

  },

  endDrag(props, monitor) {
    const container = monitor.getDropResult();
    if (container && container.id !== props.container.id) {
      props.removeItem(props.id);
    }
  } };exports.itemSource = itemSource;


const itemTarget = {
  hover(props, monitor, component) {
    const item = monitor.getItem();
    const dragIndex = item.index;
    const hoverIndex = props.index;

    if (props.id === item.id) {
      return;
    }

    if (props.container.id !== item.container.id) {
      return;
    }

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = (0, _reactDom.findDOMNode)(component).getBoundingClientRect(); // eslint-disable-line react/no-find-dom-node

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.moveItem(dragIndex, hoverIndex, item);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    item.index = hoverIndex;
    return null;
  } };exports.itemTarget = itemTarget;


class DragAndDropItem extends _react.Component {
  render() {
    const { iconHandle, isDragging, connectDragPreview, connectDragSource, connectDropTarget } = this.props;
    let propertyClass = 'list-group-item';
    if (isDragging) {
      propertyClass += ' dragging';
    }

    if (!iconHandle) {
      propertyClass += ' draggable';
    }

    const result = connectDropTarget(
    _jsx("div", { className: propertyClass }, void 0,
    iconHandle ? connectDragSource(_jsx("span", { className: "draggable" }, void 0, _jsx(_UI.Icon, { icon: "bars" }))) : _jsx(_UI.Icon, { icon: "bars" }),
    this.props.children(this.props.originalItem, this.props.index)));



    if (!iconHandle) {
      return connectDragSource(result);
    }

    return connectDragPreview(result);
  }}exports.DragAndDropItem = DragAndDropItem;


DragAndDropItem.defaultProps = {
  iconHandle: false,
  children: () => {} };















let dragAndDropItem = (0, _reactDnd.DropTarget)('DRAG_AND_DROP_ITEM', itemTarget, connector => ({
  connectDropTarget: connector.dropTarget() }))(
DragAndDropItem);

dragAndDropItem = (0, _reactDnd.DragSource)('DRAG_AND_DROP_ITEM', itemSource, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  connectDragPreview: connector.dragPreview(),
  isDragging: monitor.isDragging() }))(
dragAndDropItem);var _default =

(0, _reactRedux.connect)()(dragAndDropItem);exports.default = _default;