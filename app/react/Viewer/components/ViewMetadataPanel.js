import {connect} from 'react-redux';
import {formater} from 'app/Metadata';
import {bindActionCreators} from 'redux';
import {saveDocument, saveToc, editToc, removeFromToc, indentTocElement} from '../actions/documentActions';
import {actions as connectionsActions} from 'app/Connections';
import {uiActions as connectionsUiActions} from 'app/Connections';
import {closePanel} from '../actions/uiActions';
import {actions as formActions} from 'react-redux-form';
import {actions as actionCreators} from 'app/BasicReducer';

import DocumentForm from '../containers/DocumentForm';
import modals from 'app/Modals';
import {actions} from 'app/Metadata';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {TocForm as tocFormComponent} from 'app/Documents';
import {createSelector} from 'reselect';

import {DocumentSidePanel} from 'app/Documents';

const selectTemplates = createSelector(s => s.templates, templates => templates.toJS());
const selectThesauris = createSelector(s => s.thesauris, thesauris => thesauris.toJS());
const getSourceDoc = createSelector(s => s.documentViewer.doc, d => d.toJS());
const getTargetDoc = createSelector(s => s.documentViewer.targetDoc, targetDoc => targetDoc.toJS());
const getSourceMetadata = createSelector(
  getSourceDoc, selectTemplates, selectThesauris,
  (doc, templates, thesauris) => formater.prepareMetadata(doc, templates, thesauris)
);
const getTargetMetadata = createSelector(
  getTargetDoc, selectTemplates, selectThesauris,
  (doc, templates, thesauris) => formater.prepareMetadata(doc, templates, thesauris)
);

export const mapStateToProps = (state) => {
  let documentViewer = state.documentViewer;
  let templates = state.templates;
  let metadata = getSourceMetadata(state);
  let doc = documentViewer.doc;
  let references = documentViewer.references;

  if (documentViewer.targetDoc.get('_id')) {
    metadata = getTargetMetadata(state);
    doc = documentViewer.targetDoc;
    references = documentViewer.targetDocReferences;
  }

  const tocForm = documentViewer.tocForm || [];

  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc,
    metadata,
    templates,
    rawDoc: documentViewer.doc,
    docBeingEdited: !!documentViewer.sidepanel.metadata._id,
    formDirty: !documentViewer.sidepanel.metadataForm.$form.pristine,
    tab: documentViewer.sidepanel.tab,
    references,
    tocFormComponent,
    tocForm,
    tocFormLength: tocForm.length,
    tocBeingEdited: documentViewer.tocBeingEdited,
    tocFormState: documentViewer.tocFormState,
    isTargetDoc: !!documentViewer.targetDoc.get('_id'),
    formPath: 'documentViewer.sidepanel.metadata',
    DocumentForm
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    showModal: modals.actions.showModal,
    startNewConnection: connectionsActions.startNewConnection,
    closeConnectionsPanel: connectionsUiActions.closePanel,
    resetForm: formActions.reset,
    saveDocument,
    closePanel,
    deleteDocument,
    saveToc,
    editToc,
    removeFromToc,
    indentTocElement,
    showTab: (tab) => actionCreators.set('viewer.sidepanel.tab', tab)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
