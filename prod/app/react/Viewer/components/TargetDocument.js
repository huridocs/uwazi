"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");

var _selectionActions = require("../actions/selectionActions");
var _uiActions = require("../actions/uiActions");
var _selectors = require("../selectors");

var _Document = _interopRequireDefault(require("./Document"));
var _TargetDocumentHeader = _interopRequireDefault(require("./TargetDocumentHeader"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const mapStateToProps = state => {
  const { documentViewer } = state;
  const uiState = documentViewer.uiState.toJS();

  return {
    doc: (0, _selectors.selectTargetDoc)(state),
    references: (0, _selectors.selectTargetReferences)(state),
    docHTML: documentViewer.targetDocHTML,
    selection: uiState.reference.targetRange,
    className: 'targetDocument',
    activeReference: uiState.activeReference,
    disableTextSelection: false,
    header: _TargetDocumentHeader.default };

};

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    setSelection: _selectionActions.setTargetSelection,
    unsetSelection: _selectionActions.unsetTargetSelection,
    highlightReference: _uiActions.highlightReference,
    activateReference: _uiActions.selectReference },

  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Document.default);exports.default = _default;