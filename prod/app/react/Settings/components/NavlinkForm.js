"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.NavlinkForm = exports.LinkTarget = exports.LinkSource = void 0;var _reactDnd = require("react-dnd");
var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactDom = require("react-dom");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _uiActions = require("../actions/uiActions");
var _navlinksActions = require("../actions/navlinksActions");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const LinkSource = {
  beginDrag(props) {
    return {
      id: props.localID,
      index: props.index };

  } };exports.LinkSource = LinkSource;


const LinkTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

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
    props.sortLink(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  } };exports.LinkTarget = LinkTarget;


class NavlinkForm extends _react.Component {
  render() {
    const { link, index, isDragging, connectDragPreview, connectDragSource, connectDropTarget, formState, uiState } = this.props;
    let className = `list-group-item${isDragging ? ' dragging' : ''}`;
    let titleClass = 'input-group';

    if (formState.$form.errors[`links.${index}.title.required`]) {
      className += ' error';
      titleClass += ' has-error';
    }

    return connectDragPreview(connectDropTarget(
    _jsx("li", { className: className }, void 0,

    _jsx("div", {}, void 0,
    connectDragSource(
    _jsx("span", { className: "property-name" }, void 0,
    _jsx(_UI.Icon, { icon: "bars", className: "reorder" }), "\xA0",
    _jsx(_UI.Icon, { icon: "link" }), "\xA0\xA0", link.title && link.title.trim().length ? link.title : _jsx("em", {}, void 0, "no title")))),



    _jsx("div", {}, void 0,
    _jsx("button", {
      type: "button",
      className: "btn btn-default btn-xs property-edit",
      onClick: () => this.props.editLink(link.localID) }, void 0,

    _jsx(_UI.Icon, { icon: "pencil-alt" }), " Edit"),

    _jsx("button", {
      type: "button",
      className: "btn btn-danger btn-xs property-remove",
      onClick: () => this.props.removeLink(index) }, void 0,

    _jsx(_UI.Icon, { icon: "trash-alt" }), " Delete")),



    _jsx(_ShowIf.default, { if: uiState.get('editingLink') === link.localID }, void 0,
    _jsx("div", { className: "propery-form expand" }, void 0,
    _jsx("div", {}, void 0,
    _jsx("div", { className: "row" }, void 0,
    _jsx("div", { className: "col-sm-4" }, void 0,
    _jsx("div", { className: titleClass }, void 0,
    _jsx("span", { className: "input-group-addon" }, void 0, "Title"),


    _jsx(_reactReduxForm.Field, { model: `settings.navlinksData.links[${index}].title` }, void 0,
    _jsx("input", { className: "form-control" })))),



    _jsx("div", { className: "col-sm-8" }, void 0,
    _jsx("div", { className: "input-group" }, void 0,
    _jsx("span", { className: "input-group-addon" }, void 0, "URL"),


    _jsx(_reactReduxForm.Field, { model: `settings.navlinksData.links[${index}].url` }, void 0,
    _jsx("input", { className: "form-control" })))))))))));










  }}exports.NavlinkForm = NavlinkForm;

















const dropTarget = (0, _reactDnd.DropTarget)('LINK', LinkTarget, connectDND => ({
  connectDropTarget: connectDND.dropTarget() }))(
NavlinkForm);

const dragSource = (0, _reactDnd.DragSource)('LINK', LinkSource, (connectDND, monitor) => ({
  connectDragSource: connectDND.dragSource(),
  connectDragPreview: connectDND.dragPreview(),
  isDragging: monitor.isDragging() }))(
dropTarget);

function mapStateToProps({ settings }) {
  return { formState: settings.navlinksFormState, uiState: settings.uiState };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ editLink: _uiActions.editLink, removeLink: _navlinksActions.removeLink }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(dragSource);exports.default = _default;