"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.LibraryFilters = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");

var _filterActions = require("../actions/filterActions");
var _FiltersForm = _interopRequireDefault(require("./FiltersForm"));
var _DocumentTypesList = _interopRequireDefault(require("./DocumentTypesList"));
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class LibraryFilters extends _react.Component {
  reset() {
    this.props.resetFilters(this.props.storeKey);
  }

  render() {
    return (
      _jsx(_SidePanel.default, { className: "library-filters", open: this.props.open }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx("span", { onClick: this.reset.bind(this), className: "btn btn-primary" }, void 0,
      _jsx(_UI.Icon, { icon: "sync" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Reset'))),

      _jsx("button", { type: "submit", form: "filtersForm", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "search" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Search')))),


      _jsx("div", { className: "sidepanel-body" }, void 0,
      _jsx("p", { className: "sidepanel-title" }, void 0, (0, _I18N.t)('System', 'Filters configuration')),
      _jsx("div", { className: "documentTypes-selector nested-selector" }, void 0,
      _jsx(_DocumentTypesList.default, { storeKey: this.props.storeKey })),

      _jsx(_FiltersForm.default, { storeKey: this.props.storeKey }))));



  }}exports.LibraryFilters = LibraryFilters;








function mapStateToProps(state, props) {
  return {
    open: state[props.storeKey].ui.get('filtersPanel') !== false && !state[props.storeKey].ui.get('selectedDocuments').size > 0 };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({ resetFilters: _filterActions.resetFilters }, (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(LibraryFilters);exports.default = _default;