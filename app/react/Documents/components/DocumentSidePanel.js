/* eslint-disable max-lines */
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './scss/toc.scss';

import { MetadataFormButtons, ShowMetadata } from 'app/Metadata';
import { NeedAuthorization } from 'app/Auth';
import { t, Translate } from 'app/I18N';
import { AttachmentsList } from 'app/Attachments';
import { FileList } from 'app/Attachments/components/FileList';
import Connections from 'app/Viewer/components/ConnectionsList';
import { ConnectionsGroups } from 'app/ConnectionsList';
import ShowIf from 'app/App/ShowIf';
import SidePanel from 'app/Layout/SidePanel';
import DocumentSemanticSearchResults from 'app/SemanticSearch/components/DocumentResults';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { TocGeneratedLabel, ReviewTocButton } from 'app/ToggledFeatures/tocGeneration';
import { Icon } from 'UI';

import * as viewerModule from 'app/Viewer';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';
import SearchText from './SearchText';
import ShowToc from './ShowToc';
import SnippetsTab from './SnippetsTab';
import helpers from '../helpers';

class DocumentSidePanel extends Component {
  constructor(props) {
    super(props);
    this.selectTab = this.selectTab.bind(this);
    this.state = { copyFrom: false, copyFromProps: [] };
    this.toggleCopyFrom = this.toggleCopyFrom.bind(this);
    this.onCopyFromSelect = this.onCopyFromSelect.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.toggleSharing = this.toggleSharing.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.doc.get('_id') &&
      prevProps.doc.get('_id') !== this.props.doc.get('_id') &&
      this.props.getDocumentReferences
    ) {
      this.props.getDocumentReferences(
        this.props.doc.get('sharedId'),
        this.props.file._id,
        this.props.storeKey
      );
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
    this.setState(currentState => ({
      copyFrom: !currentState.copyFrom,
    }));
  }

  toggleSharing() {
    this.setState(currentState => ({
      sharing: !currentState.sharing,
    }));
  }

  renderHeader(tab, doc, isEntity) {
    if (this.state.copyFrom) {
      return (
        <div className="sidepanel-header">
          <Translate>Copy properties to this entity from</Translate>:
        </div>
      );
    }

    const { excludeConnectionsTab, connectionsGroups, isTargetDoc, references } = this.props;

    const summary = connectionsGroups.reduce(
      (summaryData, g) => {
        g.get('templates').forEach(template => {
          summaryData.totalConnections += template.get('count');
        });
        return summaryData;
      },
      { totalConnections: 0 }
    );
    return (
      <div className="sidepanel-header">
        <button
          type="button"
          className="closeSidepanel close-modal"
          onClick={this.close.bind(this)}
          aria-label="Close side panel"
        >
          <Icon icon="times" />
        </button>
        <Tabs selectedTab={tab} renderActiveTabContentOnly handleSelect={this.selectTab}>
          <ul className="nav nav-tabs">
            {(() => {
              if (!this.props.raw && doc.get('semanticSearch')) {
                return (
                  <li>
                    <TabLink
                      to="semantic-search-results"
                      role="button"
                      tabIndex="0"
                      aria-label={t('System', 'Semantic search results', null, false)}
                      component="div"
                    >
                      <Icon icon="flask" />
                      <span className="tab-link-tooltip">
                        <Translate>Semantic search results</Translate>
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
                    <TabLink
                      to="text-search"
                      role="button"
                      tabIndex="0"
                      aria-label={t('System', 'Search text', null, false)}
                      component="div"
                    >
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
                    <TabLink
                      to="toc"
                      role="button"
                      tabIndex="0"
                      aria-label={t('System', 'Table of Contents', null, false)}
                      component="div"
                    >
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
                    <TabLink
                      to="references"
                      role="button"
                      tabIndex="0"
                      aria-label={t('System', 'References', null, false)}
                      component="div"
                    >
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
              <TabLink
                to="metadata"
                default
                role="button"
                tabIndex="0"
                aria-label={t('System', 'Info', null, false)}
                component="div"
              >
                <Icon icon="info-circle" />
                <span className="tab-link-tooltip">{t('System', 'Info')}</span>
              </TabLink>
            </li>
            {(() => {
              if (!isTargetDoc && !excludeConnectionsTab) {
                return (
                  <li>
                    <TabLink
                      to="connections"
                      role="button"
                      tabIndex="0"
                      aria-label={t('System', 'Connections', null, false)}
                      component="div"
                    >
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
    );
  }

  render() {
    const {
      doc,
      docBeingEdited,
      readOnly,
      references,
      EntityForm,
      isTargetDoc,
      relationships,
      defaultLanguage,
    } = this.props;

    const TocForm = this.props.tocFormComponent;

    const jsDoc = helpers.performantDocToJSWithoutRelations(doc);
    const { attachments, documents, language, defaultDoc } = jsDoc;

    const isEntity = !documents || !documents.length;
    const defaultDocumentToC =
      isEntity || !defaultDoc
        ? this.getDefaultDocumentToC(isEntity, documents, language, defaultLanguage)
        : defaultDoc.toc;

    this.initialTemplateId = doc.get('template');
    const tab =
      (isEntity && (this.props.tab === 'references' || this.props.tab === 'toc')) || !this.props.tab
        ? 'metadata'
        : this.props.tab;

    const className =
      this.state.copyFrom && docBeingEdited && tab === 'metadata'
        ? 'metadata-sidepanel two-columns'
        : 'metadata-sidepanel';

    return (
      <SidePanel open={this.props.open} className={className}>
        {this.renderHeader(tab, doc, isEntity)}
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
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[jsDoc]}>
          {this.props.tab === 'toc' && this.props.tocBeingEdited && (
            <div className="sidepanel-footer">
              <div className="btn-cluster content-right">
                <button
                  type="button"
                  className="edit-toc btn btn-default"
                  onClick={this.props.leaveEditMode}
                >
                  <span className="btn-label">
                    <Translate>Cancel</Translate>
                  </span>
                </button>
                <button type="submit" form="tocForm" className="edit-toc btn btn-success">
                  <span className="btn-label">
                    <Translate>Save</Translate>
                  </span>
                </button>
              </div>
            </div>
          )}
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[jsDoc]}>
          {this.props.tab === 'toc' && !this.props.tocBeingEdited && !readOnly && (
            <div className="sidepanel-footer">
              <div className="btn-cluster">
                <button
                  type="button"
                  onClick={() => this.props.editToc(this.props.file.toc || [])}
                  className="edit-toc btn btn-default"
                >
                  <Icon icon="pencil-alt" />
                  <span className="btn-label">
                    <Translate>Edit</Translate>
                  </span>
                </button>
                <ReviewTocButton file={this.props.file}>
                  <Translate>Mark as Reviewed</Translate>
                </ReviewTocButton>
              </div>
            </div>
          )}
        </NeedAuthorization>
        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab || 'metadata'}>
            <TabContent for="text-search" className="text-search">
              <SearchText
                doc={doc}
                storeKey={this.props.storeKey}
                searchTerm={this.props.searchTerm}
              />
            </TabContent>
            <TabContent for="toc" className="toc">
              <div className="tocHeader">
                <h1>
                  <Translate>Table of contents</Translate>
                </h1>
                &nbsp;
                <TocGeneratedLabel file={this.props.file}>
                  <Translate>auto-created</Translate> ⓘ
                </TocGeneratedLabel>
              </div>
              <ShowIf if={!this.props.tocBeingEdited}>
                <ShowToc toc={defaultDocumentToC} readOnly={readOnly} />
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
            <TabContent for="metadata" className="metadata">
              {(() => {
                if (docBeingEdited && this.state.copyFrom) {
                  return (
                    <div className="side-panel-container">
                      <EntityForm
                        storeKey={this.props.storeKey}
                        initialTemplateId={this.initialTemplateId}
                        highlightedProps={this.state.copyFromProps}
                      />
                      <CopyFromEntity
                        originalEntity={this.props.formData}
                        templates={this.props.templates}
                        onSelect={this.onCopyFromSelect}
                        formModel={this.props.formPath}
                        onCancel={this.toggleCopyFrom}
                      />
                    </div>
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
                      entity={jsDoc}
                      showTitle
                      showType
                      groupGeolocations
                    />
                    <FileList files={documents} storeKey={this.props.storeKey} entity={jsDoc} />
                    <AttachmentsList
                      attachments={attachments}
                      isTargetDoc={isTargetDoc}
                      isDocumentAttachments={Boolean(doc.get('file'))}
                      parentId={doc.get('_id')}
                      parentSharedId={doc.get('sharedId')}
                      storeKey={this.props.storeKey}
                      entity={jsDoc}
                    />
                  </div>
                );
              })()}
            </TabContent>
            <TabContent for="references" className="references">
              <Connections
                referencesSection="references"
                references={references}
                readOnly={readOnly}
              />
            </TabContent>
            <TabContent for="connections" className="connections">
              <ConnectionsGroups />
            </TabContent>
            <TabContent for="semantic-search-results">
              <DocumentSemanticSearchResults doc={jsDoc} />
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
  EntityForm: () => false,
  raw: false,
  file: {},
  leaveEditMode: () => {},
};

DocumentSidePanel.propTypes = {
  doc: PropTypes.instanceOf(Object).isRequired,
  EntityForm: PropTypes.func,
  tocFormComponent: PropTypes.func,
  formDirty: PropTypes.bool,
  formPath: PropTypes.string.isRequired,
  formData: PropTypes.instanceOf(Object),
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
  leaveEditMode: PropTypes.func,
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

const mapStateToProps = (state, ownProps) => {
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
    formData: state[ownProps.storeKey].sidepanel.metadata,
  };
};

export { DocumentSidePanel, mapStateToProps };

export default connect(mapStateToProps)(DocumentSidePanel);
