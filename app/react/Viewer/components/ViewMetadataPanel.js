import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {formater, ShowMetadata} from 'app/Metadata';
import {bindActionCreators} from 'redux';
import {saveDocument, saveToc, editToc, removeFromToc, indentTocElement} from '../actions/documentActions';
import {actions as connectionsActions} from 'app/Connections';
import {uiActions as connectionsUiActions} from 'app/Connections';
import {closePanel, showTab} from '../actions/uiActions';
import {actions as formActions} from 'react-redux-form';
import {t} from 'app/I18N';

import DocumentForm from '../containers/DocumentForm';
import modals from 'app/Modals';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Connections from './ConnectionsList';
import {AttachmentsList, UploadAttachment} from 'app/Attachments';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import {actions} from 'app/Metadata';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {browserHistory} from 'react-router';
import {TocForm as tocFormComponent} from 'app/Documents';
import {MetadataFormButtons} from 'app/Metadata';
import {createSelector} from 'reselect';

import {fromJS} from 'immutable';
import {DocumentSidePanel} from 'app/Documents';

const selectTemplates = createSelector(s => s.templates, templates => templates.toJS());
const selectThesauris = createSelector(s => s.thesauris, thesauris => thesauris.toJS());
const getSourceDoc = createSelector(s => s.doc, d => d.toJS());
const getTargetDoc = createSelector(s => s.targetDoc, targetDoc => targetDoc.toJS());
const getSourceMetadata = createSelector(
  getSourceDoc, selectTemplates, selectThesauris,
  (doc, templates, thesauris) => formater.prepareMetadata(doc, templates, thesauris)
);
const getTargetMetadata = createSelector(
  getTargetDoc, selectTemplates, selectThesauris,
  (doc, templates, thesauris) => formater.prepareMetadata(doc, templates, thesauris)
);

export const mapStateToProps = ({documentViewer}) => {
  let metadata = getSourceMetadata(documentViewer);
  let doc = documentViewer.doc;
  let references = documentViewer.references;

  if (documentViewer.targetDoc.get('_id')) {
    metadata = getTargetMetadata(documentViewer);
    doc = documentViewer.targetDoc;
    references = documentViewer.targetDocReferences;
  }

  const tocForm = documentViewer.tocForm || [];

  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc,
    metadata,
    templates: documentViewer.templates,
    rawDoc: documentViewer.doc,
    docBeingEdited: !!documentViewer.sidepanel.metadata._id,
    formDirty: documentViewer.sidepanel.metadataForm.dirty,
    tab: documentViewer.uiState.get('tab'),
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
    showTab,
    saveDocument,
    closePanel,
    deleteDocument,
    saveToc,
    editToc,
    removeFromToc,
    indentTocElement
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
