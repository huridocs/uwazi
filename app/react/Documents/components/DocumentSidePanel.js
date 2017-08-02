import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {ShowMetadata} from 'app/Metadata';
import {t} from 'app/I18N';
import {browserHistory} from 'react-router';

import AttachmentsList from 'app/Attachments/components/AttachmentsList';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Connections from 'app/Viewer/components/ConnectionsList';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import ShowToc from './ShowToc';
import {MetadataFormButtons} from 'app/Metadata';
import SearchText from './SearchText';

import {fromJS} from 'immutable';
import {createSelector} from 'reselect';

const selectReferences = createSelector(
  s => s.references,
  (refs) => {
    return refs.filter(r => {
      return typeof r.get('range').get('start') !== 'undefined';
    });
  }
);

const selectConnections = createSelector(
  s => s.references,
  (refs) => {
    return refs.filter(r => {
      return typeof r.get('range').get('start') === 'undefined';
    });
  }
);

export class DocumentSidePanel extends Component {
  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.doc.toJS())
        .then(() => {
          const currentPath = browserHistory.getCurrentLocation().pathname;
          const isLibraryorUploads = /library|uploads|^\/$|^\/..\/$/;
          if (!currentPath.match(isLibraryorUploads)) {
            browserHistory.goBack();
          }
        });
      },
      title: 'Confirm',
      message: 'Are you sure you want to delete this item?'
    });
  }

  componentWillReceiveProps(newProps) {
    if (newProps.doc.get('_id') && newProps.doc.get('_id') !== this.props.doc.get('_id') && this.props.getDocumentReferences) {
      this.props.getDocumentReferences(newProps.doc.get('sharedId'), this.props.storeKey);
    }
  }

  close() {
    if (this.props.formDirty) {
      this.context.confirm({
        accept: () => {
          this.props.resetForm(this.props.formPath);
          this.props.closePanel();
        },
        title: 'Confirm',
        message: 'All changes will be lost, are you sure you want to proceed?'
      });
      return;
    }
    this.props.resetForm(this.props.formPath);
    this.props.closePanel();
  }

  render() {
    const {doc, docBeingEdited, DocumentForm, readOnly, references, connections, EntityForm} = this.props;
    const TocForm = this.props.tocFormComponent;

    const docAttachments = doc.get('attachments') ? doc.get('attachments').toJS() : [];
    const docFile = Object.assign({}, doc.get('file') ? doc.get('file').toJS() : {});
    const attachments = doc.get('file') ? [docFile].concat(docAttachments) : docAttachments;
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
                    <TabLink to="text-search">
                      <i className="fa fa-search"></i>
                      <span className="tab-link-tooltip">{t('System', 'Search text')}</span>
                    </TabLink>
                  </li>;
                }
              })()}
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
              {(() => {
                if (docType !== 'entity') {
                  return <li className="tab-separator"></li>;
                }
                return <span/>;
              })()}
              <li>
                <TabLink to="metadata" default>
                  <i className="fa fa-info-circle"></i>
                  <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="connections">
                  <i className="fa fa-exchange"></i>
                  <span className="connectionsNumber">{connections.size}</span>
                  <span className="tab-link-tooltip">{t('System', 'Connections')}</span>
                </TabLink>
              </li>
            </ul>
          </Tabs>
        </div>
        <ShowIf if={this.props.tab === 'metadata' || !this.props.tab}>
          <div className="sidepanel-footer">
            <MetadataFormButtons
              delete={this.deleteDocument.bind(this)}
              data={this.props.doc}
              formStatePath={this.props.formPath}
              entityBeingEdited={docBeingEdited}
              includeViewButton={!docBeingEdited && readOnly}
              storeKey={this.props.storeKey}
            />
          </div>
        </ShowIf>

        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={this.props.tab === 'toc' && this.props.tocBeingEdited}>
            <div className="sidepanel-footer">
              <button type="submit" form="tocForm" className="edit-toc btn btn-success">
                <i className="fa fa-save"></i>
                <span className="btn-label">Save</span>
              </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={this.props.tab === 'toc' && !this.props.tocBeingEdited && !readOnly}>
            <div className="sidepanel-footer">
              <button onClick={() => this.props.editToc(this.props.doc.get('toc').toJS() || [])} className="edit-toc btn btn-success">
                <i className="fa fa-pencil"></i>
                <span className="btn-label">Edit</span>
              </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization roles={['admin', 'editor']}>
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

        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab || 'metadata'}>
            <TabContent for="text-search">
              <SearchText doc={doc} storeKey={this.props.storeKey} searchTerm={this.props.searchTerm}/>
            </TabContent>
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
                  return <DocumentForm storeKey={this.props.storeKey} />;
                }
                if (docBeingEdited && this.props.doc.get('type') === 'entity') {
                  return <EntityForm storeKey={this.props.storeKey} />;
                }

                return (
                  <div>
                    <ShowMetadata entity={this.props.metadata} showTitle={true} showType={true} />
                    <AttachmentsList files={fromJS(attachments)}
                      readOnly={readOnly}
                      isDocumentAttachments={Boolean(doc.get('file'))}
                      parentId={doc.get('_id')}
                      parentSharedId={doc.get('sharedId')}
                      storeKey={this.props.storeKey}/>
                  </div>
                );
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
  searchTerm: PropTypes.string,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  tocBeingEdited: PropTypes.bool,
  showTab: PropTypes.func,
  tab: PropTypes.string,
  saveDocument: PropTypes.func,
  startNewConnection: PropTypes.func,
  closePanel: PropTypes.func,
  showModal: PropTypes.func,
  deleteDocument: PropTypes.func,
  resetForm: PropTypes.func,
  references: PropTypes.object,
  connections: PropTypes.object,
  tocFormState: PropTypes.object,
  tocForm: PropTypes.array,
  saveToc: PropTypes.func,
  editToc: PropTypes.func,
  getDocumentReferences: PropTypes.func,
  removeFromToc: PropTypes.func,
  indentTocElement: PropTypes.func,
  searchSnippets: PropTypes.func,
  isTargetDoc: PropTypes.bool,
  readOnly: PropTypes.bool,
  storeKey: PropTypes.string
};

DocumentSidePanel.contextTypes = {
  confirm: PropTypes.func
};

DocumentSidePanel.defaultProps = {
  tocFormComponent: () => false,
  EntityForm: () => false
};

export const mapStateToProps = (state, ownProps) => {
  return {
    references: selectReferences(ownProps),
    connections: selectConnections(ownProps)
  };
};

export default connect(mapStateToProps)(DocumentSidePanel);
