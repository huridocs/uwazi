import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';

import { DocumentSidePanel, TocForm as tocFormComponent } from 'app/Documents';
import { actions as actionCreators } from 'app/BasicReducer';
import { actions } from 'app/Metadata';
import {
  actions as connectionsActions,
  uiActions as connectionsUiActions
} from 'app/Connections';
import { deleteDocument } from 'app/Viewer/actions/documentActions';
import modals from 'app/Modals';

import { closePanel } from '../actions/uiActions';
import { saveToc, editToc, removeFromToc, indentTocElement } from '../actions/documentActions';
import DocumentForm from '../containers/DocumentForm';

export const mapStateToProps = (state) => {
  const documentViewer = state.documentViewer;
  const templates = state.templates;
  let doc = documentViewer.doc;
  // TEST!!! Removed
  // let references = documentViewer.references;

  if (documentViewer.targetDoc.get('_id')) {
    doc = documentViewer.targetDoc;
    // TEST!!! Removed
    // references = documentViewer.targetDocReferences;
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
    // TEST!!! Removed
    // references,
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
    closePanel,
    deleteDocument,
    saveToc,
    editToc,
    removeFromToc,
    indentTocElement,
    showTab: tab => actionCreators.set('viewer.sidepanel.tab', tab)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
