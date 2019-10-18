"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.TargetDocumentHeader = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _UI = require("../../UI");
var _referencesActions = require("../actions/referencesActions");
var _documentActions = require("../actions/documentActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class TargetDocumentHeader extends _react.Component {
  save(connection, targetRange) {
    return this.props.saveTargetRangedReference(connection.toJS(), targetRange, ref => {
      this.props.addReference(ref, this.props.pdfInfo.toJS(), true);
    });
  }

  render() {
    const { targetDocument, reference, connection } = this.props;
    const { targetRange } = reference;

    let className = 'btn btn-default hidden';

    if (targetDocument && targetRange) {
      className = 'btn btn-success';
    }

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: "relationship-steps is-fixed" }, void 0,
      _jsx("button", { onClick: this.props.cancelTargetDocument, className: "btn btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: "arrow-left" }), "Back"),


      _jsx("h2", {}, void 0, "Select target paragraph", _jsx("small", {}, void 0, "3"))),

      _jsx("div", { className: "ContextMenu ContextMenu-center" }, void 0,
      _jsx("button", {
        onClick: this.save.bind(this, connection, targetRange),
        className: className }, void 0,

      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "ContextMenu-tooltip" }, void 0, "Save")))));




  }}exports.TargetDocumentHeader = TargetDocumentHeader;













function mapStateToProps({ documentViewer, connections }) {
  return {
    connection: connections.connection,
    reference: documentViewer.uiState.toJS().reference,
    targetDocument: documentViewer.targetDoc.get('_id'),
    pdfInfo: documentViewer.doc.get('pdfInfo') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    saveTargetRangedReference: _referencesActions.saveTargetRangedReference,
    cancelTargetDocument: _documentActions.cancelTargetDocument,
    addReference: _referencesActions.addReference },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(TargetDocumentHeader);exports.default = _default;