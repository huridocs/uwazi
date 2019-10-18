"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ViewerTextSelectedMenu = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _Connections = require("../../Connections");
var _uiActions = require("../actions/uiActions");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _UI = require("../../UI");
var _documentActions = require("../actions/documentActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ViewerTextSelectedMenu extends _react.Component {
  showPanel(type) {
    this.props.openPanel('viewMetadataPanel');
    this.props.startNewConnection(type, this.props.doc.get('sharedId'));
  }

  render() {
    return (
      _jsx("div", { className: this.props.active ? 'active' : '' }, void 0,
      _jsx(_ShowIf.default, { if: this.props.hasRelationTypes }, void 0,
      _jsx("div", {
        className: "btn btn-primary",
        onClick: this.showPanel.bind(this, 'targetRanged') }, void 0,

      _jsx("span", { className: "ContextMenu-tooltip" }, void 0, "Connect to a paragraph"),
      _jsx(_UI.Icon, { icon: "paragraph" }))),


      _jsx(_ShowIf.default, { if: this.props.hasRelationTypes }, void 0,
      _jsx("div", {
        className: "btn btn-primary",
        onClick: this.showPanel.bind(this, 'ranged') }, void 0,

      _jsx("span", { className: "ContextMenu-tooltip" }, void 0, "Connect to a document"),
      _jsx(_UI.Icon, { icon: "file" }))),


      _jsx("div", {
        className: "btn btn-primary",
        onClick: this.props.addToToc.bind(null, this.props.reference.toJS()) }, void 0,

      _jsx("span", { className: "ContextMenu-tooltip" }, void 0, "Add to table of contents"),
      _jsx(_UI.Icon, { icon: "font" }))));



  }}exports.ViewerTextSelectedMenu = ViewerTextSelectedMenu;












function mapStateToProps({ documentViewer, relationTypes }) {
  return {
    doc: documentViewer.doc,
    reference: documentViewer.uiState.get('reference'),
    hasRelationTypes: !!relationTypes.size };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    startNewConnection: _Connections.actions.startNewConnection,
    openPanel: _uiActions.openPanel,
    addToToc: _documentActions.addToToc },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ViewerTextSelectedMenu);exports.default = _default;