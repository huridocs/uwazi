/* eslint-disable max-lines */
import React, { Component } from 'react';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { Icon } from 'UI';
import { withContext, withRouter } from 'app/componentWrappers';
import { MetadataFormButtons, ShowMetadata } from 'app/Metadata';
import { NeedAuthorization } from 'app/Auth';
import { I18NLink, t, Translate } from 'app/I18N';
import { AttachmentsList } from 'app/Attachments';
import { FileList } from 'app/Attachments/components/FileList';
import Connections from 'app/Viewer/components/ConnectionsList';
import { ConnectionsGroups } from 'app/ConnectionsList';
import ShowIf from 'app/App/ShowIf';
import SidePanel from 'app/Layout/SidePanel';
import DocumentSemanticSearchResults from 'app/SemanticSearch/components/DocumentResults';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { TocGeneratedLabel, ReviewTocButton } from 'app/ToggledFeatures/tocGeneration';
import { actions } from 'app/BasicReducer';
import { Item } from 'app/Layout';
import * as viewerModule from 'app/Viewer';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';
import ViewDocButton from 'app/Library/components/ViewDocButton';
import { getDocumentReferences } from 'app/Library/actions/libraryActions';
import { store } from '../../store';
import SearchText from './SearchText';
import ShowToc from './ShowToc';
import SnippetsTab from './SnippetsTab';
import helpers from '../helpers';
import './scss/toc.scss';

class DocumentSidePanel extends Component {
  constructor(props) {
    super(props);
    this.selectTab = this.selectTab.bind(this);
    this.state = { copyFrom: false, copyFromProps: [], relationshipsExpanded: true };
    this.toggleCopyFrom = this.toggleCopyFrom.bind(this);
    this.onCopyFromSelect = this.onCopyFromSelect.bind(this);
    this.updateRelationships = this.updateRelationships.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.toggleSharing = this.toggleSharing.bind(this);
  }

  componentDidMount() {
    if (this.props.selectedDocument) {
      this.updateRelationships(this.props.selectedDocument.get('sharedId'));
    }
  }

  async componentDidUpdate(prevProps) {
    const sharedId = this.props.doc.get('sharedId');
    if (this.props.doc.get('_id') && prevProps.doc.get('_id') !== this.props.doc.get('_id')) {
      this.updateRelationships(sharedId);
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

  async updateRelationships(sharedId) {
    if (sharedId && this.props.connectionsChanged && getDocumentReferences) {
      this.props.getDocumentReferences(sharedId, this.props.file._id, this.props.storeKey);
      this.props.connectionsChanged(sharedId);
    }
  }

  deleteDocument() {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.doc.toJS()).then(() => {
          const currentPath = this.props.location.pathname;
          const isLibrary = /library|^\/$|^\/..\/$/;
          if (!currentPath.match(isLibrary)) {
            this.props.navigate(-1);
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
      this.props.mainContext.confirm({
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

  collapseRelationships() {
    // Toggles the states to force re-rendering
    this.setState({ relationshipsExpanded: true }, () =>
      this.setState({ relationshipsExpanded: false })
    );
  }

  expandRelationships() {
    // Toggles the states to force re-rendering
    this.setState({ relationshipsExpanded: false }, () =>
      this.setState({ relationshipsExpanded: true })
    );
  }

  // eslint-disable-next-line class-methods-use-this
  linkClassNames(selectedTabMatches) {
    return `${selectedTabMatches ? 'selected' : ''} entity-sidepanel-tab-link`;
  }

  renderHeader(tab, doc, isEntity) {
    if (this.state.copyFrom) {
      return (
        <div className="sidepanel-header">
          <Translate>Copy properties to this entity from</Translate>:
        </div>
      );
    }

    const {
      excludeConnectionsTab,
      connectionsGroups,
      isTargetDoc,
      references,
      currentSidepanelView,
    } = this.props;

    const summary = connectionsGroups.reduce(
      (summaryData, group) => {
        const summarizedData = { ...summaryData };
        group.get('templates').forEach(template => {
          summarizedData.totalConnections += template.get('count');
        });
        return summarizedData;
      },
      { totalConnections: 0 }
    );

    return (
      <>
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
                      <ShowIf if={currentSidepanelView === 'entity'}>
                        <TabLink
                          className=""
                          to="semantic-search-results"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Semantic search results', null, false)}
                          component="div"
                        >
                          <I18NLink
                            className={this.linkClassNames(tab === 'semantic-search-results')}
                            to={`/entity/${doc.get('sharedId')}/semantic-search-results`}
                            onClick={() =>
                              store.dispatch(
                                actions.set('viewer.sidepanel.tab', 'semantic-search-results')
                              )
                            }
                          >
                            <Icon icon="flask" />
                            <span className="tab-link-tooltip">
                              <Translate>Semantic search results</Translate>
                            </span>
                          </I18NLink>
                        </TabLink>
                      </ShowIf>
                      <ShowIf if={currentSidepanelView === 'library'}>
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
                      </ShowIf>
                    </li>
                  );
                }
              })()}
              {(() => {
                if (!this.props.raw) {
                  return (
                    <li>
                      <ShowIf if={currentSidepanelView === 'entity'}>
                        <TabLink
                          to="text-search"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Search text', null, false)}
                          component="div"
                        >
                          <I18NLink
                            className={this.linkClassNames(tab === 'text-search')}
                            to={`/entity/${doc.get('sharedId')}/text-search`}
                            onClick={() =>
                              store.dispatch(actions.set('viewer.sidepanel.tab', 'text-search'))
                            }
                          >
                            <SnippetsTab storeKey={this.props.storeKey} />
                          </I18NLink>
                        </TabLink>
                      </ShowIf>
                      <ShowIf if={currentSidepanelView === 'library'}>
                        <TabLink
                          to="text-search"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Search text', null, false)}
                          component="div"
                        >
                          <SnippetsTab storeKey={this.props.storeKey} />
                        </TabLink>
                      </ShowIf>
                    </li>
                  );
                }
              })()}
              {(() => {
                if (!isEntity && !this.props.raw) {
                  return (
                    <li>
                      <ShowIf if={currentSidepanelView === 'entity'}>
                        <TabLink
                          to="toc"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Table of Contents', null, false)}
                          component="div"
                        >
                          <I18NLink
                            className={this.linkClassNames(tab === 'toc')}
                            to={`/entity/${doc.get('sharedId')}/toc`}
                            onClick={() =>
                              store.dispatch(actions.set('viewer.sidepanel.tab', 'toc'))
                            }
                          >
                            <Icon icon="font" />
                            <span className="tab-link-tooltip">
                              {t('System', 'Table of Contents')}
                            </span>
                          </I18NLink>
                        </TabLink>
                      </ShowIf>
                      <ShowIf if={currentSidepanelView === 'library'}>
                        <TabLink
                          to="toc"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Table of Contents', null, false)}
                          component="div"
                        >
                          <Icon icon="font" />
                          <span className="tab-link-tooltip">
                            {t('System', 'Table of Contents')}
                          </span>
                        </TabLink>
                      </ShowIf>
                    </li>
                  );
                }
                return <span />;
              })()}
              {(() => {
                if (!isEntity && !this.props.raw) {
                  return (
                    <li>
                      <ShowIf if={currentSidepanelView === 'entity'}>
                        <TabLink
                          to="references"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'References', null, false)}
                          component="div"
                        >
                          <I18NLink
                            className={this.linkClassNames(tab === 'references')}
                            to={`/entity/${doc.get('sharedId')}/references`}
                            onClick={() =>
                              store.dispatch(actions.set('viewer.sidepanel.tab', 'references'))
                            }
                          >
                            <Icon icon="sitemap" />
                            <span className="connectionsNumber">{references.size}</span>
                            <span className="tab-link-tooltip">{t('System', 'References')}</span>
                          </I18NLink>
                        </TabLink>
                      </ShowIf>
                      <ShowIf if={currentSidepanelView === 'library'}>
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
                      </ShowIf>
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
                <ShowIf if={currentSidepanelView === 'entity'}>
                  <TabLink
                    to="metadata"
                    default
                    role="button"
                    tabIndex="0"
                    aria-label={t('System', 'Info', null, false)}
                    component="div"
                  >
                    <I18NLink
                      className={this.linkClassNames(tab === 'metadata' || tab === '')}
                      to={`/entity/${doc.get('sharedId')}/metadata`}
                      onClick={() =>
                        store.dispatch(actions.set('viewer.sidepanel.tab', 'metadata'))
                      }
                    >
                      <Icon icon="info-circle" />
                      <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                    </I18NLink>
                  </TabLink>
                </ShowIf>
                <ShowIf if={currentSidepanelView === 'library'}>
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
                </ShowIf>
              </li>
              {(() => {
                if (!isTargetDoc && !excludeConnectionsTab) {
                  return (
                    <li>
                      <ShowIf if={currentSidepanelView === 'entity'}>
                        <TabLink
                          to="relationships"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Relationships', null, false)}
                          component="div"
                        >
                          <I18NLink
                            className={this.linkClassNames(tab === 'relationships')}
                            to={`/entity/${doc.get('sharedId')}/relationships`}
                            onClick={() =>
                              store.dispatch(actions.set('viewer.sidepanel.tab', 'relationships'))
                            }
                          >
                            <Icon icon="exchange-alt" />
                            <span className="connectionsNumber">{summary.totalConnections}</span>
                            <span className="tab-link-tooltip">{t('System', 'Relationships')}</span>
                          </I18NLink>
                        </TabLink>
                      </ShowIf>
                      <ShowIf if={currentSidepanelView === 'library'}>
                        <TabLink
                          to="relationships"
                          role="button"
                          tabIndex="0"
                          aria-label={t('System', 'Relationships', null, false)}
                          component="div"
                        >
                          <Icon icon="exchange-alt" />
                          <span className="connectionsNumber">{summary.totalConnections}</span>
                          <span className="tab-link-tooltip">{t('System', 'Relationships')}</span>
                        </TabLink>
                      </ShowIf>
                    </li>
                  );
                }
              })()}
              <li>
                <ShowIf
                  if={this.props.newRelationshipsEnabled && currentSidepanelView === 'entity'}
                >
                  <TabLink
                    to="newrelationships"
                    role="button"
                    tabIndex="0"
                    aria-label="New Relationships"
                    component="div"
                  >
                    <I18NLink
                      className={this.linkClassNames(['newrelationships'])}
                      to={`/entity/${doc.get('sharedId')}/newrelationships`}
                      onClick={() =>
                        store.dispatch(actions.set('viewer.sidepanel.tab', 'newrelationships'))
                      }
                    >
                      <Icon icon="exchange-alt" />*
                      <span className="tab-link-tooltip" no-translate>
                        New Relationships
                      </span>
                    </I18NLink>
                  </TabLink>
                </ShowIf>
              </li>
            </ul>
          </Tabs>
        </div>
        <ShowIf if={this.props.tab === 'relationships'}>
          <div>
            <Item active={false} doc={this.props.doc} className="item-collapsed" noMetadata />
          </div>
        </ShowIf>
      </>
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
      currentSidepanelView,
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
      <SidePanel data-testid="metadata-sidepanel" open={this.props.open} className={className}>
        {this.renderHeader(tab, doc, isEntity)}
        <ShowIf if={(this.props.tab === 'metadata' || !this.props.tab) && !this.state.copyFrom}>
          <div className="sidepanel-footer">
            <MetadataFormButtons
              delete={this.deleteDocument}
              data={this.props.doc}
              formStatePath={this.props.formPath}
              formState={this.props.formState}
              entityBeingEdited={docBeingEdited}
              includeViewButton={!docBeingEdited && readOnly}
              storeKey={this.props.storeKey}
              copyFrom={this.toggleCopyFrom}
            />
          </div>
        </ShowIf>
        <ShowIf if={this.props.tab === 'relationships' && currentSidepanelView === 'library'}>
          <div className="sidepanel-footer">
            <div className="relationships-left-buttons">
              <ViewDocButton icon="file" sharedId={doc.get('sharedId')} />
            </div>
            <div className="relationships-right-buttons">
              <button
                type="button"
                className="btn btn-default relationships-collapse-button"
                style={{ marginRight: '10px' }}
                onClick={() => this.collapseRelationships()}
              >
                <Translate>Collapse all</Translate>
              </button>
              <button
                type="button"
                className="btn btn-default relationships-expand-button"
                onClick={() => this.expandRelationships()}
              >
                <Translate>Expand all</Translate>
              </button>
            </div>
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
        <div className="sidepanel-body scrollable">
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
            <TabContent for="relationships" className="connections">
              <ConnectionsGroups expanded={this.state.relationshipsExpanded} />
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
  connectionsChanged: undefined,
  tocFormComponent: () => false,
  EntityForm: () => false,
  raw: false,
  file: {},
  leaveEditMode: () => {},
  selectedDocument: undefined,
  // relationships v2
  newRelationshipsEnabled: false,
};

DocumentSidePanel.propTypes = {
  doc: PropTypes.instanceOf(Object).isRequired,
  EntityForm: PropTypes.func,
  tocFormComponent: PropTypes.func,
  formDirty: PropTypes.bool,
  formPath: PropTypes.string.isRequired,
  formData: PropTypes.instanceOf(Object),
  formState: PropTypes.instanceOf(Object).isRequired,
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
  connectionsChanged: PropTypes.func,
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
  currentSidepanelView: PropTypes.string.isRequired,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    query: PropTypes.shape({ page: PropTypes.string, raw: PropTypes.string }),
    search: PropTypes.string,
  }).isRequired,
  navigate: PropTypes.func.isRequired,
  selectedDocument: PropTypes.instanceOf(Immutable),
  // relationships v2
  newRelationshipsEnabled: PropTypes.bool,
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

  const selectedDocument =
    state.library.ui.get('selectedDocuments').size === 1
      ? state.library.ui.get('selectedDocuments').get(0)
      : null;

  return {
    references,
    excludeConnectionsTab: Boolean(state.relationships.list.connectionsGroups.length),
    connectionsGroups: state.relationships.list.connectionsGroups,
    relationships: ownProps.references,
    defaultLanguage,
    templates: state.templates,
    formData: state[ownProps.storeKey].sidepanel.metadata,
    formState: state[ownProps.storeKey].sidepanel.metadataForm,
    currentSidepanelView: state.library.sidepanel.view,
    selectedDocument,
    // relationships v2
    newRelationshipsEnabled: state.settings?.collection?.get('features')?.get('newRelationships'),
  };
};

export { DocumentSidePanel, mapStateToProps };

export default connect(mapStateToProps)(withContext(withRouter(DocumentSidePanel)));
