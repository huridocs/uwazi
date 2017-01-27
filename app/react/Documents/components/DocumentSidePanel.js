import React, {Component, PropTypes} from 'react';
import SidePanel from 'app/Layout/SidePanel';
import {ShowMetadata} from 'app/Metadata';
import {t} from 'app/I18N';

import AttachmentsList from 'app/Attachments/components/AttachmentsList';
import UploadAttachment from 'app/Attachments/components/UploadAttachment';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Connections from 'app/Viewer/components/ConnectionsList';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import {browserHistory} from 'react-router';
import ShowToc from './ShowToc';
import {MetadataFormButtons} from 'app/Metadata';

import {fromJS} from 'immutable';

export class DocumentSidePanel extends Component {
  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.doc.toJS())
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
    this.props.resetForm(this.props.formPath);
    this.props.closePanel();
  }

  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    const {doc, docBeingEdited, DocumentForm} = this.props;

    const TocForm = this.props.tocFormComponent || (() => false);
    const EntityForm = this.props.EntityForm || (() => false);

    const references = this.props.references.filter(r => {
      return typeof r.get('range').get('start') !== 'undefined';
    });
    const connections = this.props.references.filter(r => {
      return typeof r.get('range').get('start') === 'undefined';
    });

    const docAttachments = doc.get('attachments') ? doc.get('attachments').toJS() : [];
    const docFile = Object.assign({}, doc.file, {originalname: doc.title + '.pdf'});
    const attachments = doc.file ? [docFile].concat(docAttachments) : docAttachments;
    const readOnly = this.props.readOnly;
    const startNewConnection = readOnly ? () => {} : this.props.startNewConnection.bind(null, 'basic', doc.get('sharedId'));

    const docType = this.props.doc.get('type');

    let tab = this.props.tab || 'metadata';
    if (docType === 'entity' && (tab === 'references' || tab === 'toc')) {
      tab = 'metadata';
    }
    return (
      <SidePanel open={this.props.open} className="metadata-sidepanel">
        <div className="sidepanel-header">
          <i className="closeSidepanel fa fa-close close-modal" onClick={this.close.bind(this)}/>&nbsp;
          <Tabs selectedTab={tab}
            handleSelect={(selectedTab) => {
              this.props.showTab(selectedTab);
            }}>
            <ul className="nav nav-tabs">
              {(() => {
                if (docType !== 'entity') {
                  return <li>
                    <TabLink to="toc">
                      <i className="fa fa-font"></i>
                      <span className="tab-link-tooltip">{t('System', 'Table of Content')}</span>
                    </TabLink>
                  </li>;
                }
                return <span/>;
              })()}
              <li>
                <TabLink to="metadata" default>
                  <i className="fa fa-info-circle"></i>
                  <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                </TabLink>
              </li>
              {(() => {
                if (docType !== 'entity') {
                  return <li>
                    <TabLink to="references">
                      <i className="fa fa-sitemap"></i>
                      <span className="connectionsNumber">{references.size}</span>
                      <span className="tab-link-tooltip">{t('System', 'References')}</span>
                    </TabLink>
                  </li>;
                }
                return <span/>;
              })()}
              <li>
                <TabLink to="connections">
                  <i className="fa fa-exchange"></i>
                  <span className="connectionsNumber">{connections.size}</span>
                  <span className="tab-link-tooltip">{t('System', 'Connections')}</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="attachments">
                  <i className="fa fa-download"></i>
                  <span className="connectionsNumber">{attachments.length}</span>
                  <span className="tab-link-tooltip">{t('System', 'Attachments')}</span>
                </TabLink>
              </li>
            </ul>
          </Tabs>
        </div>
        <ShowIf if={this.props.tab === 'metadata' || !this.props.tab}>
          <MetadataFormButtons
            delete={this.deleteDocument.bind(this)}
            data={this.props.doc}
            formStatePath={this.props.formPath}
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
          <ShowIf if={this.props.tab === 'toc' && !this.props.tocBeingEdited && !readOnly}>
            <div className="sidepanel-footer">
              <button onClick={() => this.props.editToc(this.props.doc.get('toc').toJS() || [])} className="edit-toc btn btn-success">
                <i className="fa fa-pencil"></i>
                <span className="btn-label">Edit</span>
              </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization>
          <ShowIf if={this.props.tab === 'connections' && !this.props.isTargetDoc && !readOnly}>
            <div className="sidepanel-footer">
              <button onClick={startNewConnection}
                className="create-connection btn btn-success">
                <i className="fa fa-plus"></i>
                <span className="btn-label">New</span>
              </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization>
          <ShowIf if={this.props.tab === 'attachments' && !this.props.isTargetDoc && !readOnly}>
            <div className="sidepanel-footer">
              <UploadAttachment entityId={doc.get('_id')}/>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab || 'metadata'}>
            <TabContent for="toc">
              <ShowIf if={!this.props.tocBeingEdited}>
                <ShowToc toc={doc.get('toc')} readOnly={readOnly} />
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
                if (docBeingEdited && this.props.doc.get('type') === 'document') {
                  return <DocumentForm onSubmit={this.submit.bind(this)} />;
                }
                if (docBeingEdited && this.props.doc.get('type') === 'entity') {
                  return <EntityForm/>;
                }

                return <ShowMetadata entity={this.props.metadata} showTitle={true} showType={true} />;
              })()}
            </TabContent>
            <TabContent for="references">
              <Connections
                referencesSection="references"
                references={references}
                readOnly={readOnly}
              />
            </TabContent>
            <TabContent for="connections">
              <Connections references={connections}
                readOnly={readOnly}
                referencesSection="connections"
                useSourceTargetIcons={false} />
            </TabContent>
            <TabContent for="attachments">
              <AttachmentsList files={fromJS(attachments)}
                readOnly={readOnly}
                isDocumentAttachments={true}
                parentId={doc.get('_id')}
                parentSharedId={doc.get('sharedId')} />
            </TabContent>
          </Tabs>
        </div>
      </SidePanel>
    );
  }
}

DocumentSidePanel.propTypes = {
  doc: PropTypes.object,
  metadata: PropTypes.object,
  EntityForm: PropTypes.func,
  tocFormComponent: PropTypes.func,
  DocumentForm: PropTypes.func,
  formDirty: PropTypes.bool,
  formPath: PropTypes.string,
  templates: PropTypes.object,
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
  isTargetDoc: PropTypes.bool,
  readOnly: PropTypes.bool
};

DocumentSidePanel.contextTypes = {
  confirm: PropTypes.func
};

export default DocumentSidePanel;
