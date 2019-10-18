"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _requestState = _interopRequireDefault(require("./helpers/requestState"));
var _MapView = _interopRequireDefault(require("./components/MapView"));
var _LibraryLayout = _interopRequireDefault(require("./LibraryLayout"));
var _Library = _interopRequireDefault(require("./Library"));
var _LibraryModeToggleButtons = _interopRequireDefault(require("./components/LibraryModeToggleButtons"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class LibraryMap extends _Library.default {
  static async requestState(requestParams, globalResources) {
    return (0, _requestState.default)(requestParams, globalResources, 'markers');
  }

  render() {
    return (
      _jsx(_LibraryLayout.default, { className: "library-map-layout" }, void 0,
      _jsx(_LibraryModeToggleButtons.default, {
        storeKey: "library",
        zoomIn: () => {this.mapView.getWrappedInstance().map.zoomIn();},
        zoomOut: () => {this.mapView.getWrappedInstance().map.zoomOut();},
        zoomLevel: 0 }),

      _react.default.createElement(_MapView.default, { storeKey: "library", ref: ref => {this.mapView = ref;} })));


  }}exports.default = LibraryMap;