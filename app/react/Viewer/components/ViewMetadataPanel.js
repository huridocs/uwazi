import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';

import { DocumentSidePanel, TocForm as tocFormComponent } from '#app/Documents/index.js';
import { actions as actionCreators } from '#app/BasicReducer/index.js';
import { actions } from '#app/Metadata/index.js';
import {
  actions as connectionsActions,
  uiActions as connectionsUiActions,
} from '#app/Connections/index.js';
import { deleteDocument } from '#app/Viewer/actions/documentActions.js';
import modals from '#app/Modals/index.js';

import { closePanel } from '../actions/uiActions.js';
import {
  saveToc,
  editToc,
  leaveEditMode,
  removeFromToc,
  indentTocElement,
} from '../actions/documentActions.js';
import { DocumentForm } from '../containers/DocumentForm.js';

export const mapStateToProps = state => {
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
    tab: documentViewer.sidepanel.tab || 'metadata',
    tocFormComponent,
    tocForm,
    tocFormLength: tocForm.length,
    tocBeingEdited: documentViewer.tocBeingEdited,
    tocFormState: documentViewer.tocFormState,
    isTargetDoc: !!documentViewer.targetDoc.get('_id'),
    formPath: 'documentViewer.sidepanel.metadata',
    EntityForm: DocumentForm,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
      showModal: modals.actions.showModal,
      startNewConnection: connectionsActions.startNewConnection,
      closeConnectionsPanel: connectionsUiActions.closePanel,
      resetForm: formActions.reset,
      closePanel,
      deleteDocument,
      saveToc,
      editToc,
      leaveEditMode,
      removeFromToc,
      indentTocElement,
      showTab: tab => actionCreators.set('viewer.sidepanel.tab', tab),
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
