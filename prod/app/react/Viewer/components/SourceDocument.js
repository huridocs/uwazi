"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");


var _selectionActions = require("../actions/selectionActions");
var _uiActions = require("../actions/uiActions");
var _Document = _interopRequireDefault(require("./Document"));
var _reselect = require("reselect");
var _selectors = require("../selectors");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const selectSourceRange = (0, _reselect.createSelector)(s => s.uiState, u => u.toJS().reference.sourceRange);
const selectActiveRef = (0, _reselect.createSelector)(s => s.uiState, u => u.toJS().activeReference);

const mapStateToProps = state => {
  const { user, documentViewer } = state;
  return {
    selectedSnippet: documentViewer.uiState.get('snippet'),
    selection: selectSourceRange(documentViewer),
    doScrollToActive: documentViewer.uiState.get('goToActive'),
    doc: (0, _selectors.selectDoc)(state),
    references: (0, _selectors.selectReferences)(state),
    className: 'sourceDocument',
    activeReference: selectActiveRef(documentViewer),
    executeOnClickHandler: !!documentViewer.targetDoc.get('_id'),
    disableTextSelection: !user.get('_id'),
    panelIsOpen: !!documentViewer.uiState.get('panel'),
    forceSimulateSelection: documentViewer.uiState.get('panel') === 'targetReferencePanel' ||
    documentViewer.uiState.get('panel') === 'referencePanel' };

};

function mapDispatchToProps(dispatch) {
  const actions = {
    setSelection: _selectionActions.setSelection,
    unsetSelection: _selectionActions.unsetSelection,
    onClick: _uiActions.resetReferenceCreation,
    highlightReference: _uiActions.highlightReference,
    activateReference: _uiActions.activateReference,
    scrollToActive: _uiActions.scrollToActive };

  return (0, _redux.bindActionCreators)(actions, dispatch);
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return Object.assign({}, stateProps, dispatchProps, ownProps, { unsetSelection: dispatchProps.unsetSelection });
}var _default =
(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps, mergeProps)(_Document.default);exports.default = _default;