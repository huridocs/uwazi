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
import {TocForm, ShowToc} from 'app/Documents';
import {MetadataFormButtons} from 'app/Metadata';
import {createSelector} from 'reselect';

import {fromJS} from 'immutable';

export class ViewMetadataPanel extends Component {
  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.rawDoc.toJS())
        .then(() => {
          browserHistory.push('/');
        });
      },
      title: 'Confirm delete document',
      message: 'Are you sure you want to delete this document?'
    });
  }

  close() {
    if (this.props.formDirty) {
      return this.props.showModal('ConfirmCloseForm', this.props.doc);
    }
    this.props.resetForm('documentViewer.docForm');
    this.props.showTab();
    this.props.closePanel();
  }

  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    const {doc, docBeingEdited} = this.props;

    const propReferences = this.props.references.toJS();
    const references = propReferences.filter(r => {
      return typeof r.range.start !== 'undefined';
    });
    const connections = propReferences.filter(r => {
      return typeof r.range.start === 'undefined';
    });

    const docAttachments = doc.attachments ? doc.attachments : [];
    const docFile = Object.assign({}, doc.file, {originalname: doc.title + '.pdf'});
    const attachments = doc.file ? [docFile].concat(docAttachments) : docAttachments;

    return (
      <SidePanel open={this.props.open} className="metadata-sidepanel">
        <div className="sidepanel-header">
          <i className="closeSidepanel fa fa-close close-modal" onClick={this.close.bind(this)}/>&nbsp;
          <Tabs selectedTab={this.props.tab || 'metadata'}
            handleSelect={(tab) => {
              this.props.showTab(tab);
            }}>
            <ul className="nav nav-tabs">
              <li>
                <TabLink to="toc">
                  <i className="fa fa-indent"></i>
                  <span className="tab-link-tooltip">Table of Content</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="metadata" default>
                  <i className="fa fa-info-circle"></i>
                  <span className="tab-link-tooltip">Info</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="references">
                  <i className="fa fa-sitemap"></i>
                  <span className="connectionsNumber">{references.length}</span>
                  <span className="tab-link-tooltip">References</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="connections">
                  <i className="fa fa-share-alt"></i>
                  <span className="connectionsNumber">{connections.length}</span>
                  <span className="tab-link-tooltip">Connections</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="attachments">
                  <i className="fa fa-download"></i>
                  <span className="connectionsNumber">{attachments.length}</span>
                  <span className="tab-link-tooltip">Attachments</span>
                </TabLink>
              </li>
            </ul>
          </Tabs>
        </div>
        <ShowIf if={this.props.tab === 'metadata' || !this.props.tab}>
          <MetadataFormButtons
            delete={this.deleteDocument.bind(this)}
            data={this.props.rawDoc}
            formStatePath='documentViewer.docForm'
            entityBeingEdited={docBeingEdited}
          />
        </ShowIf>

        <NeedAuthorization>
          <ShowIf if={this.props.tab === 'toc' && this.props.tocBeingEdited}>
            <div className="sidepanel-footer">
            <button type="submit" form="tocForm" className="edit-toc btn btn-success">
              <i className="fa fa-save"></i>
              <span className="btn-label">Save</span>
            </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization>
          <ShowIf if={this.props.tab === 'toc' && !this.props.tocBeingEdited}>
            <div className="sidepanel-footer">
            <button onClick={() => this.props.editToc(this.props.doc.toc || [])} className="edit-toc btn btn-success">
              <i className="fa fa-pencil"></i>
              <span className="btn-label">Edit</span>
            </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization>
          <ShowIf if={this.props.tab === 'connections' && !this.props.isTargetDoc}>
            <div className="sidepanel-footer">
            <button onClick={this.props.startNewConnection.bind(null, 'basic', doc.sharedId)}
                    className="create-connection btn btn-success">
              <i className="fa fa-plus"></i>
              <span className="btn-label">New</span>
            </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization>
          <ShowIf if={this.props.tab === 'attachments' && !this.props.isTargetDoc}>
            <div className="sidepanel-footer">
              <UploadAttachment entityId={doc._id}/>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab || 'metadata'}>
            <TabContent for="toc">
              <ShowIf if={!this.props.tocBeingEdited}>
                <ShowToc toc={doc.toc || []} />
              </ShowIf>
              <ShowIf if={this.props.tocBeingEdited}>
                <TocForm
                  removeEntry={this.props.removeFromToc}
                  indent={this.props.indentTocElement}
                  onSubmit={this.props.saveToc}
                  model="documentViewer.tocForm"
                  state={this.props.tocFormState}
                  toc={this.props.tocForm}
                />
              </ShowIf>
            </TabContent>
            <TabContent for="metadata">
              {(() => {
                if (docBeingEdited) {
                  return <DocumentForm onSubmit={this.submit.bind(this)} />;
                }
                return <ShowMetadata entity={doc} showTitle={true} showType={true} />;
              })()}
            </TabContent>
            <TabContent for="references">
              <Connections references={fromJS(references)} />
            </TabContent>
            <TabContent for="connections">
              <Connections references={fromJS(connections)}
                           referencesSection="connections"
                           useSourceTargetIcons={false} />
            </TabContent>
            <TabContent for="attachments">
              <AttachmentsList files={fromJS(attachments)}
                               isDocumentAttachments={true}
                               parentId={doc._id}
                               parentSharedId={doc.sharedId} />
            </TabContent>
          </Tabs>
        </div>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  formDirty: PropTypes.bool,
  templates: PropTypes.object,
  rawDoc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  tocBeingEdited: PropTypes.bool,
  showTab: PropTypes.func,
  tab: PropTypes.string,
  saveDocument: PropTypes.func,
  startNewConnection: PropTypes.func,
  closeConnectionsPanel: PropTypes.func,
  closePanel: PropTypes.func,
  showModal: PropTypes.func,
  deleteDocument: PropTypes.func,
  resetForm: PropTypes.func,
  loadInReduxForm: PropTypes.func,
  references: PropTypes.object,
  tocFormState: PropTypes.object,
  tocForm: PropTypes.array,
  tocFormLength: PropTypes.number,
  saveToc: PropTypes.func,
  editToc: PropTypes.func,
  removeFromToc: PropTypes.func,
  indentTocElement: PropTypes.func,
  isTargetDoc: PropTypes.bool
};

ViewMetadataPanel.contextTypes = {
  confirm: PropTypes.func
};

const selectTemplates = createSelector(s => s.templates, t => t.toJS());
const selectThesauris = createSelector(s => s.thesauris, t => t.toJS());
const getSourceDoc = createSelector(s => s.doc, d => d.toJS());
const getTargetDoc = createSelector(s => s.targetDoc, t => t.toJS());
const getSourceMetadata = createSelector(
  getSourceDoc, selectTemplates, selectThesauris,
  (doc, templates, thesauris) => formater.prepareMetadata(doc, templates, thesauris)
);
const getTargetMetadata = createSelector(
  getTargetDoc, selectTemplates, selectThesauris,
  (doc, templates, thesauris) => formater.prepareMetadata(doc, templates, thesauris)
);

export const mapStateToProps = ({documentViewer}) => {
  let doc = getSourceMetadata(documentViewer);
  let references = documentViewer.references;

  if (documentViewer.targetDoc.get('_id')) {
    doc = getTargetMetadata(documentViewer);
    references = documentViewer.targetDocReferences;
  }

  const tocForm = documentViewer.tocForm || [];

  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    templates: documentViewer.templates,
    doc,
    rawDoc: documentViewer.doc,
    docBeingEdited: !!documentViewer.docForm._id,
    formDirty: documentViewer.docFormState.dirty,
    tab: documentViewer.uiState.get('tab'),
    references,
    tocForm,
    tocFormLength: tocForm.length,
    tocBeingEdited: documentViewer.tocBeingEdited,
    tocFormState: documentViewer.tocFormState,
    isTargetDoc: !!documentViewer.targetDoc.get('_id')
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
