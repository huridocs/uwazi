import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { MetadataFormButtons, ShowMetadata } from 'app/Metadata';
import { NeedAuthorization } from 'app/Auth';
import { t } from 'app/I18N';
import { AttachmentsList } from 'app/Attachments';
import { FileList } from 'app/Attachments/components/FileList';
import Connections from 'app/Viewer/components/ConnectionsList';
import { ConnectionsGroups } from 'app/ConnectionsList';
import ShowIf from 'app/App/ShowIf';
import SidePanel from 'app/Layout/SidePanel';
import DocumentSemanticSearchResults from 'app/SemanticSearch/components/DocumentResults';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { Icon } from 'UI';

import * as viewerModule from 'app/Viewer';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';
import SearchText from './SearchText';
import ShowToc from './ShowToc';
import SnippetsTab from './SnippetsTab';

export class DocumentSidePanel extends Component {
  constructor(props) {
    super(props);
    this.selectTab = this.selectTab.bind(this);
    this.firstRender = true;
    this.state = { copyFrom: false, copyFromProps: [] };

    this.toggleCopyFrom = this.toggleCopyFrom.bind(this);
    this.onCopyFromSelect = this.onCopyFromSelect.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (
      newProps.doc.get('_id') &&
      newProps.doc.get('_id') !== this.props.doc.get('_id') &&
      this.props.getDocumentReferences
    ) {
      this.props.getDocumentReferences(newProps.doc.get('sharedId'), this.props.storeKey);
    }
  }

  onCopyFromSelect(copyFromProps) {
    this.setState({ copyFromProps });
  }

  getDefaultDocumentToC(isEntity, documents, language, defaultLanguage) {
    let defaultDocumentToC = this.props.file.toc;

    if (!isEntity) {
      const defaultDocument = {
        ...entityDefaultDocument(documents, language, defaultLanguage),
      };
      if (defaultDocument) {
        defaultDocumentToC = defaultDocument.toc;
      }
    }
    return defaultDocumentToC;
  }

  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.doc.toJS()).then(() => {
          const currentPath = browserHistory.getCurrentLocation().pathname;
          const isLibraryorUploads = /library|uploads|^\/$|^\/..\/$/;
          if (!currentPath.match(isLibraryorUploads)) {
            browserHistory.goBack();
          }
        });
      },
      title: 'Confirm',
      message: 'Are you sure you want to delete this item?',
    });
  }

  selectTab(tabSelected) {
    this.props.showTab(tabSelected);
  }

  _close() {
    this.props.resetForm(this.props.formPath);
    this.props.closePanel();
    this.setState({ copyFrom: false });
  }

  close() {
    if (this.props.formDirty) {
      this.context.confirm({
        accept: () => {
          this._close();
        },
        title: 'Confirm',
        message: 'All changes will be lost, are you sure you want to proceed?',
      });
      return;
    }
    this._close();
  }

  toggleCopyFrom() {
    this.setState({
      copyFrom: !this.state.copyFrom,
    });
  }

  render() {
    const {
      doc,
      docBeingEdited,
      readOnly,
      references,
      EntityForm,
      connectionsGroups,
      isTargetDoc,
      excludeConnectionsTab,
      relationships,
      defaultLanguage,
    } = this.props;
    const TocForm = this.props.tocFormComponent;

    const { attachments, documents, language, defaultDoc } = doc.toJS();

    const isEntity = !documents || !documents.length;
    const defaultDocumentToC =
      isEntity || !defaultDoc
        ? this.getDefaultDocumentToC(isEntity, documents, language, defaultLanguage)
        : defaultDoc.toc;

    this.initialTemplateId = doc.get('template');
    const tab =
      isEntity && (this.props.tab === 'references' || this.props.tab === 'toc' || !tab)
        ? 'metadata'
        : this.props.tab;

    const summary = connectionsGroups.reduce(
      (summaryData, g) => {
        g.get('templates').forEach(template => {
          summaryData.totalConnections += template.get('count');
        });
        return summaryData;
      },
      { totalConnections: 0 }
    );

    const className =
      this.state.copyFrom && docBeingEdited && tab === 'metadata'
        ? 'metadata-sidepanel two-columns'
        : 'metadata-sidepanel';
    return (
      <SidePanel open={this.props.open} className={className}>
        <div className="sidepanel-header">
          <button className="closeSidepanel close-modal" onClick={this.close.bind(this)}>
            <Icon icon="times" />
          </button>
          <Tabs selectedTab={tab} renderActiveTabContentOnly handleSelect={this.selectTab}>
            <ul className="nav nav-tabs">
              {(() => {
                if (!this.props.raw && doc.get('semanticSearch')) {
                  return (
                    <li>
                      <TabLink to="semantic-search-results">
                        <Icon icon="flask" />
                        <span className="tab-link-tooltip">
                          {t('System', 'Semantic search results')}
                        </span>
                      </TabLink>
                    </li>
                  );
                }
              })()}
              {(() => {
                if (!this.props.raw) {
                  return (
                    <li>
                      <TabLink to="text-search">
                        <SnippetsTab storeKey={this.props.storeKey} />
                      </TabLink>
                    </li>
                  );
                }
              })()}
              {(() => {
                if (!isEntity && !this.props.raw) {
                  return (
                    <li>
                      <TabLink to="toc">
                        <Icon icon="font" />
                        <span className="tab-link-tooltip">{t('System', 'Table of Contents')}</span>
                      </TabLink>
                    </li>
                  );
                }
                return <span />;
              })()}
              {(() => {
                if (!isEntity && !this.props.raw) {
                  return (
                    <li>
                      <TabLink to="references">
                        <Icon icon="sitemap" />
                        <span className="connectionsNumber">{references.size}</span>
                        <span className="tab-link-tooltip">{t('System', 'References')}</span>
                      </TabLink>
                    </li>
                  );
                }
                return <span />;
              })()}
              {(() => {
                if (!this.props.raw) {
                  return <li className="tab-separator" />;
                }
                return <span />;
              })()}
              <li>
                <TabLink to="metadata" default>
                  <Icon icon="info-circle" />
                  <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                </TabLink>
              </li>
              {(() => {
                if (!isTargetDoc && !excludeConnectionsTab) {
                  return (
                    <li>
                      <TabLink to="connections">
                        <Icon icon="exchange-alt" />
                        <span className="connectionsNumber">{summary.totalConnections}</span>
                        <span className="tab-link-tooltip">{t('System', 'Connections')}</span>
                      </TabLink>
                    </li>
                  );
                }
              })()}
            </ul>
          </Tabs>
        </div>
        <ShowIf if={(this.props.tab === 'metadata' || !this.props.tab) && !this.state.copyFrom}>
          <div className="sidepanel-footer">
            <MetadataFormButtons
              delete={this.deleteDocument}
              data={this.props.doc}
              formStatePath={this.props.formPath}
              entityBeingEdited={docBeingEdited}
              includeViewButton={!docBeingEdited && readOnly}
              storeKey={this.props.storeKey}
              copyFrom={this.toggleCopyFrom}
            />
          </div>
        </ShowIf>

        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={this.props.tab === 'toc' && this.props.tocBeingEdited}>
            <div className="sidepanel-footer">
              <button type="submit" form="tocForm" className="edit-toc btn btn-success">
                <Icon icon="save" />
                <span className="btn-label">Save</span>
              </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={this.props.tab === 'toc' && !this.props.tocBeingEdited && !readOnly}>
            <div className="sidepanel-footer">
              <button
                onClick={() => this.props.editToc(this.props.file.toc || [])}
                className="edit-toc btn btn-success"
              >
                <Icon icon="pencil-alt" />
                <span className="btn-label">Edit</span>
              </button>
            </div>
          </ShowIf>
        </NeedAuthorization>

        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab || 'metadata'}>
            <TabContent for="text-search">
              <SearchText
                doc={doc}
                storeKey={this.props.storeKey}
                searchTerm={this.props.searchTerm}
              />
            </TabContent>
            <TabContent for="toc">
              <ShowIf if={!this.props.tocBeingEdited}>
                <ShowToc
                  toc={defaultDocumentToC}
                  pdfInfo={this.props.file.pdfInfo}
                  readOnly={readOnly}
                />
              </ShowIf>
              <ShowIf if={this.props.tocBeingEdited}>
                <TocForm
                  removeEntry={this.props.removeFromToc}
                  indent={this.props.indentTocElement}
                  onSubmit={this.props.saveToc}
                  model="documentViewer.tocForm"
                  state={this.props.tocFormState}
                  toc={this.props.tocForm}
                  file={this.props.file}
                />
              </ShowIf>
            </TabContent>
            <TabContent for="metadata">
              {(() => {
                if (docBeingEdited && this.state.copyFrom) {
                  return (
                    <React.Fragment>
                      <EntityForm
                        storeKey={this.props.storeKey}
                        initialTemplateId={this.initialTemplateId}
                      />
                      <CopyFromEntity
                        originalTemplateId={this.props.doc.get('template')}
                        templates={this.props.templates}
                        onSelect={this.onCopyFromSelect}
                        formModel={this.props.formPath}
                        onCancel={this.toggleCopyFrom}
                      />
                    </React.Fragment>
                  );
                }
                if (docBeingEdited) {
                  return (
                    <EntityForm
                      storeKey={this.props.storeKey}
                      initialTemplateId={this.initialTemplateId}
                    />
                  );
                }
                return (
                  <div>
                    <ShowMetadata
                      relationships={relationships}
                      entity={this.props.doc.toJS()}
                      showTitle
                      showType
                    />
                    <FileList
                      files={documents}
                      storeKey={this.props.storeKey}
                      entity={doc.toJS()}
                    />
                    <AttachmentsList
                      attachments={attachments}
                      isTargetDoc={isTargetDoc}
                      isDocumentAttachments={Boolean(doc.get('file'))}
                      parentId={doc.get('_id')}
                      parentSharedId={doc.get('sharedId')}
                      storeKey={this.props.storeKey}
                    />
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
              <ConnectionsGroups />
            </TabContent>
            <TabContent for="semantic-search-results">
              <DocumentSemanticSearchResults doc={this.props.doc.toJS()} />
            </TabContent>
          </Tabs>
        </div>
      </SidePanel>
    );
  }
}

DocumentSidePanel.defaultProps = {
  tab: 'metadata',
  open: false,
  tocBeingEdited: false,
  docBeingEdited: false,
  searchTerm: '',
  references: Immutable.fromJS([]),
  relationships: Immutable.fromJS([]),
  tocFormState: {},
  formDirty: false,
  isTargetDoc: false,
  readOnly: false,
  getDocumentReferences: undefined,
  tocFormComponent: () => false,
  DocumentForm: () => false,
  EntityForm: () => false,
  raw: false,
  file: {},
};

DocumentSidePanel.propTypes = {
  doc: PropTypes.instanceOf(Object).isRequired,
  EntityForm: PropTypes.func,
  tocFormComponent: PropTypes.func,
  DocumentForm: PropTypes.func,
  formDirty: PropTypes.bool,
  formPath: PropTypes.string.isRequired,
  searchTerm: PropTypes.string,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  tocBeingEdited: PropTypes.bool,
  showTab: PropTypes.func.isRequired,
  tab: PropTypes.string,
  closePanel: PropTypes.func.isRequired,
  deleteDocument: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  connectionsGroups: PropTypes.instanceOf(Immutable.List).isRequired,
  references: PropTypes.instanceOf(Immutable.List),
  relationships: PropTypes.instanceOf(Immutable.List),
  tocFormState: PropTypes.instanceOf(Object),
  tocForm: PropTypes.array,
  saveToc: PropTypes.func,
  editToc: PropTypes.func,
  searchSnippets: PropTypes.func,
  getDocumentReferences: PropTypes.func,
  removeFromToc: PropTypes.func,
  indentTocElement: PropTypes.func,
  isTargetDoc: PropTypes.bool,
  readOnly: PropTypes.bool,
  excludeConnectionsTab: PropTypes.bool.isRequired,
  storeKey: PropTypes.string.isRequired,
  raw: PropTypes.bool,
  file: PropTypes.object,
  defaultLanguage: PropTypes.string.isRequired,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
};

DocumentSidePanel.contextTypes = {
  confirm: PropTypes.func,
};

export const mapStateToProps = (state, ownProps) => {
  const isTargetDoc = state.documentViewer.targetDoc.get('_id');
  const relevantReferences = isTargetDoc
    ? viewerModule.selectors.selectTargetReferences(state)
    : viewerModule.selectors.selectReferences(state);
  const references = ownProps.references
    ? viewerModule.selectors.parseReferences(ownProps.doc, ownProps.references)
    : relevantReferences;
  const defaultLanguage = state.settings.collection
    .get('languages')
    .find(l => l.get('default'))
    .get('key');
  return {
    references,
    excludeConnectionsTab: Boolean(ownProps.references),
    connectionsGroups: state.relationships.list.connectionsGroups,
    relationships: ownProps.references,
    defaultLanguage,
    templates: state.templates,
  };
};

export default connect(mapStateToProps)(DocumentSidePanel);
