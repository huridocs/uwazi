"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.mapStateToProps = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactReduxForm = require("react-redux-form");

var _Documents = require("../../Documents");
var _BasicReducer = require("../../BasicReducer");
var _Metadata = require("../../Metadata");
var _libraryActions = require("../../Library/actions/libraryActions");
var _actions = require("../../Entities/actions/actions");
var _Multireducer = _interopRequireDefault(require("../../Multireducer"));
var _Modals = _interopRequireDefault(require("../../Modals"));

var _DocumentForm = _interopRequireDefault(require("../../Library/containers/DocumentForm"));
var _EntityForm = _interopRequireDefault(require("../../Library/containers/EntityForm"));


var _actions2 = _interopRequireDefault(require("../actions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const mapStateToProps = ({ semanticSearch, library, templates }) => ({
  open: !semanticSearch.selectedDocument.isEmpty(),
  doc: semanticSearch.selectedDocument,
  references: library.sidepanel.references,
  tab: library.sidepanel.tab,
  docBeingEdited: !!Object.keys(library.sidepanel.metadata).length,
  searchTerm: library.search.searchTerm,
  formDirty: !library.sidepanel.metadataForm.$form.pristine,
  templates,
  formPath: 'library.sidepanel.metadata',
  readOnly: true,
  DocumentForm: _DocumentForm.default,
  EntityForm: _EntityForm.default,
  storeKey: 'library' });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    loadInReduxForm: _Metadata.actions.loadInReduxForm,
    getDocumentReferences: _libraryActions.getDocumentReferences,
    closePanel: _actions2.default.unselectSemanticSearchDocument,
    resetForm: () => _dispatch => {
      _dispatch(_reactReduxForm.actions.setInitial(`${props.storeKey}.sidepanel.metadata`));
      _dispatch(_reactReduxForm.actions.reset(`${props.storeKey}.sidepanel.metadata`));
    },
    saveDocument: _libraryActions.saveDocument,
    deleteDocument: _libraryActions.deleteDocument,
    searchSnippets: _libraryActions.searchSnippets,
    deleteEntity: _actions.deleteEntity,
    showModal: _Modals.default.actions.showModal,
    showTab: tab => _BasicReducer.actions.set('library.sidepanel.tab', tab) },
  _Multireducer.default.wrapDispatch(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Documents.DocumentSidePanel);exports.default = _default;