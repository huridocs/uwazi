"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.ItemName = exports.ItemFooter = exports.RowList = exports.List = void 0;
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _UI = require("../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const List = ({ children }) => _jsx("div", { className: "item-group" }, void 0, children);exports.List = List;

const ItemName = ({ children }) => _jsx("div", { className: "item-name" }, void 0, _jsx("span", {}, void 0, children));exports.ItemName = ItemName;

const ItemFooter = ({ children, onClick }) => _jsx("div", { className: "item-actions", onClick: onClick }, void 0, children);exports.ItemFooter = ItemFooter;

const ProgressBar = ({ progress }) => {
  let message = `${progress} % Completed`;
  let icon = 'upload';
  if (progress === 100) {
    message = 'Processing...';
    icon = 'clock';
  }
  return (
    _jsx("div", { className: "label-progress" }, void 0,
    _jsx("span", { className: "label label-info" }, void 0,
    _jsx(_UI.Icon, { icon: icon }), " ", _jsx("span", {}, void 0, message)),

    _jsx("div", { className: "progress" }, void 0,
    _jsx("div", { className: "progress-bar progress-bar-striped active", style: { width: `${progress}%` } }))));



};

const ItemLabel = ({ children, status }) => {
  let icon = '';
  if (status === 'success') {
    icon = _jsx(_UI.Icon, { icon: "check" });
  }
  if (status === 'danger') {
    icon = _jsx(_UI.Icon, { icon: "times" });
  }
  if (status === 'warning') {
    icon = _jsx(_UI.Icon, { icon: "exclamation-triangle" });
  }
  return (
    _jsx("span", { className: `label label-${status || 'default'}` }, void 0,
    icon, " ", _jsx("span", {}, void 0, children)));


};

ItemFooter.Label = ItemLabel;
ItemFooter.ProgressBar = ProgressBar;

const RowList = ({ children, zoomLevel }) => _jsx("div", { className: `item-group item-group-zoom-${zoomLevel}` }, void 0, children);exports.RowList = RowList;

const RowListItem = ({ children, status, onClick, onMouseEnter, onMouseLeave, active, className }) => {
  let activeClass = '';
  if (active === true) {
    activeClass = 'is-active';
  }
  if (active === false) {
    activeClass = 'is-disabled';
  }

  return (
    _jsx("div", {
      className: `${className} item item-status item-${status || 'default'} ${activeClass}`,
      onClick: onClick,
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave }, void 0,

    children));


};

RowList.Item = RowListItem;









RowList.defaultProps = {
  children: '',
  zoomLevel: 0 };