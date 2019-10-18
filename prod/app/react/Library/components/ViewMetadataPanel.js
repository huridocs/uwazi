"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));

var _Documents = require("../../Documents");
var _BasicReducer = require("../../BasicReducer");
var _Metadata = require("../../Metadata");
var _libraryActions = require("../actions/libraryActions");
var _actions = require("../../Entities/actions/actions");
var _Multireducer = require("../../Multireducer");
var _Modals = _interopRequireDefault(require("../../Modals"));


var _DocumentForm = _interopRequireDefault(require("../containers/DocumentForm"));
var _EntityForm = _interopRequireDefault(require("../containers/EntityForm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const getTemplates = state => state.templates;

const mapStateToProps = (state, props) => {
  const library = state[props.storeKey];
  return {
    open: library.ui.get('selectedDocuments').size === 1,
    doc: library.ui.get('selectedDocuments').first() || _immutable.default.fromJS({}),
    references: library.sidepanel.references,
    tab: library.sidepanel.tab,
    docBeingEdited: !!Object.keys(library.sidepanel.metadata).length,
    searchTerm: library.search.searchTerm,
    formDirty: !library.sidepanel.metadataForm.$form.pristine,
    templates: getTemplates(state),
    formPath: `${props.storeKey}.sidepanel.metadata`,
    readOnly: true,
    DocumentForm: _DocumentForm.default,
    EntityForm: _EntityForm.default };

};

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    loadInReduxForm: _Metadata.actions.loadInReduxForm,
    getDocumentReferences: _libraryActions.getDocumentReferences,
    closePanel: _libraryActions.unselectAllDocuments,
    resetForm: () => _dispatch => {
      _dispatch(_reactReduxForm.actions.setInitial(`${props.storeKey}.sidepanel.metadata`));
      _dispatch(_reactReduxForm.actions.reset(`${props.storeKey}.sidepanel.metadata`));
    },
    saveDocument: _libraryActions.saveDocument,
    deleteDocument: _libraryActions.deleteDocument,
    searchSnippets: _libraryActions.searchSnippets,
    deleteEntity: _actions.deleteEntity,
    showModal: _Modals.default.actions.showModal,
    showTab: tab => _BasicReducer.actions.set(`${props.storeKey}.sidepanel.tab`, tab) },
  (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Documents.DocumentSidePanel);exports.default = _default;