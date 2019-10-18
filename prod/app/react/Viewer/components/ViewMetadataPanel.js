"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactReduxForm = require("react-redux-form");

var _Documents = require("../../Documents");
var _BasicReducer = require("../../BasicReducer");
var _Metadata = require("../../Metadata");
var _Connections = require("../../Connections");



var _documentActions = require("../actions/documentActions");
var _Modals = _interopRequireDefault(require("../../Modals"));

var _uiActions = require("../actions/uiActions");

var _DocumentForm = _interopRequireDefault(require("../containers/DocumentForm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const mapStateToProps = state => {
  const { documentViewer } = state;
  const { templates } = state;
  let { doc } = documentViewer;

  if (documentViewer.targetDoc.get('_id')) {
    doc = documentViewer.targetDoc;
  }
  const semanticDoc = state.semanticSearch.selectedDocument;
  if (!semanticDoc.isEmpty() && semanticDoc.get('sharedId') === doc.get('sharedId')) {
    doc = doc.set('semanticSearch', semanticDoc.get('semanticSearch'));
  }

  const tocForm = documentViewer.tocForm || [];

  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc,
    templates,
    rawDoc: documentViewer.doc,
    docBeingEdited: !!documentViewer.sidepanel.metadata._id,
    formDirty: !documentViewer.sidepanel.metadataForm.$form.pristine,
    tab: documentViewer.sidepanel.tab,
    tocFormComponent: _Documents.TocForm,
    tocForm,
    tocFormLength: tocForm.length,
    tocBeingEdited: documentViewer.tocBeingEdited,
    tocFormState: documentViewer.tocFormState,
    isTargetDoc: !!documentViewer.targetDoc.get('_id'),
    formPath: 'documentViewer.sidepanel.metadata',
    DocumentForm: _DocumentForm.default };

};exports.mapStateToProps = mapStateToProps;

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    loadInReduxForm: _Metadata.actions.loadInReduxForm,
    showModal: _Modals.default.actions.showModal,
    startNewConnection: _Connections.actions.startNewConnection,
    closeConnectionsPanel: _Connections.uiActions.closePanel,
    resetForm: _reactReduxForm.actions.reset,
    closePanel: _uiActions.closePanel,
    deleteDocument: _documentActions.deleteDocument,
    saveToc: _documentActions.saveToc,
    editToc: _documentActions.editToc,
    removeFromToc: _documentActions.removeFromToc,
    indentTocElement: _documentActions.indentTocElement,
    showTab: tab => _BasicReducer.actions.set('viewer.sidepanel.tab', tab) },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Documents.DocumentSidePanel);exports.default = _default;