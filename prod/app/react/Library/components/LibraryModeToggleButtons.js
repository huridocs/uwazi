"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.LibraryModeToggleButtons = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _libraryActions = require("../actions/libraryActions");
var _Map = require("../../Map");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class LibraryModeToggleButtons extends _react.Component {
  render() {
    const { numberOfMarkers, zoomLevel, zoomOut, zoomIn, showGeolocation, searchUrl } = this.props;
    const numberOfMarkersText = numberOfMarkers.toString().length > 3 ? '99+' : numberOfMarkers;

    return (
      _jsx("div", { className: "list-view-mode" }, void 0,
      _jsx("div", { className: `list-view-mode-zoom list-view-buttons-zoom-${zoomLevel} buttons-group` }, void 0,
      _jsx("button", { className: "btn btn-default zoom-out", onClick: zoomOut, type: "button" }, void 0,
      _jsx(_UI.Icon, { icon: "search-minus" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Zoom out'))),

      _jsx("button", { className: "btn btn-default zoom-in", onClick: zoomIn, type: "button" }, void 0,
      _jsx(_UI.Icon, { icon: "search-plus" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Zoom in')))),



      showGeolocation &&
      _jsx("div", { className: "list-view-mode-map buttons-group" }, void 0,
      _jsx(_I18N.I18NLink, { to: `library${searchUrl}`, className: "btn btn-default", activeClassName: "is-active" }, void 0,
      _jsx(_UI.Icon, { icon: "th" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'List view'))),

      _jsx(_I18N.I18NLink, {
        disabled: !numberOfMarkers,
        to: `library/map${searchUrl}`,
        className: "btn btn-default",
        activeClassName: "is-active" }, void 0,

      _jsx(_UI.Icon, { icon: "map-marker" }),
      _jsx("span", { className: "number-of-markers" }, void 0, numberOfMarkersText),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Map view'))))));





  }}exports.LibraryModeToggleButtons = LibraryModeToggleButtons;











function mapStateToProps(state, props) {
  const filters = state[props.storeKey].filters.toJS();
  const params = (0, _libraryActions.processFilters)(state[props.storeKey].search, filters);
  const { templates } = state;
  const showGeolocation = Boolean(templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation')));
  const numberOfMarkers = _Map.helper.getMarkers(state[props.storeKey].markers.get('rows'), state.templates).length;
  return {
    searchUrl: (0, _libraryActions.encodeSearch)(params),
    showGeolocation,
    numberOfMarkers,
    zoomLevel: Object.keys(props).indexOf('zoomLevel') !== -1 ? props.zoomLevel : state[props.storeKey].ui.get('zoomLevel') };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(LibraryModeToggleButtons);exports.default = _default;