/* eslint-disable max-lines */
import React, { Component } from 'react';
import Immutable from 'immutable';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { Icon } from 'UI';
import { withContext, withRouter } from 'app/componentWrappers';
import { AttachmentsList } from 'app/Attachments';
import { ConnectionsGroups, ConnectionsList, ResetSearch } from 'app/ConnectionsList';
import { CreateConnectionPanel, actions as connectionsActions } from 'app/Connections';
import { MetadataFormButtons, ShowMetadata } from 'app/Metadata';
import { RelationshipsFormButtons } from 'app/Relationships';
import { TemplateLabel, Icon as PropertyIcon } from 'app/Layout';
import { connectionsChanged, deleteConnection } from 'app/ConnectionsList/actions/actions';
import { t, I18NLink } from 'app/I18N';
import AddEntitiesPanel from 'app/Relationships/components/AddEntities';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import ShowIf from 'app/App/ShowIf';
import SidePanel from 'app/Layout/SidePanel';
import ContextMenu from 'app/ContextMenu';
import { FileList } from 'app/Attachments/components/FileList';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { PageViewer } from 'app/Pages/components/PageViewer';

import { ShowSidepanelMenu } from './ShowSidepanelMenu';
import V2NewRelationshipsBoard from './V2NewRelationshipsBoard';
import { deleteEntity } from '../actions/actions';
import { showTab } from '../actions/uiActions';
import EntityForm from '../containers/EntityForm';

class EntityViewer extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      panelOpen: !this.props.hasPageView,
      copyFrom: false,
      copyFromProps: [],
    };
    this.deleteEntity = this.deleteEntity.bind(this);
    this.closePanel = this.closePanel.bind(this);
    this.openPanel = this.openPanel.bind(this);
    this.toggleCopyFrom = this.toggleCopyFrom.bind(this);
    this.onCopyFromSelect = this.onCopyFromSelect.bind(this);
    this.deleteConnection = this.deleteConnection.bind(this);
  }

  componentDidMount() {
    const { params, hasPageView } = this.props;
    if (hasPageView && !params.tabView) {
      this.props.showTab('page');
    } else {
      this.props.showTab(params.tabView);
    }
  }

  onCopyFromSelect(copyFromProps) {
    this.setState({ copyFromProps });
  }

  deleteEntity() {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.deleteEntity(this.props.entity.toJS()).then(() => {
          this.props.navigate(-1);
        });
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this entity?',
    });
  }

  toggleCopyFrom() {
    this.setState(currentState => ({
      copyFrom: !currentState.copyFrom,
    }));
  }

  deleteConnection(reference) {
    if (reference.sourceType !== 'metadata') {
      this.props.mainContext.confirm({
        accept: () => {
          this.props.deleteConnection(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?',
      });
    }
  }

  closePanel() {
    this.setState({ panelOpen: false });
  }

  openPanel() {
    this.setState({ panelOpen: true });
  }

  linkClassNames(tabsToSelect) {
    const { tab: selectedTab } = this.props;
    return `${tabsToSelect.includes(selectedTab) ? 'selected' : ''} entity-sidepanel-tab-link`;
  }

  render() {
    const {
      entity,
      entityBeingEdited,
      tab: selectedTab,
      connectionsGroups,
      relationships,
      hasPageView,
      user,
    } = this.props;

    const { panelOpen, copyFrom, copyFromProps } = this.state;
    const rawEntity = entity.toJS();
    const summary = connectionsGroups.reduce(
      (summaryData, g) => {
        g.get('templates').forEach(template => {
          summaryData.totalConnections += template.get('count');
        });
        return summaryData;
      },
      { totalConnections: 0 }
    );

    const includeFooter = user.get('_id') && ['info', 'relationships'].includes(selectedTab);
    const hasHeader = ['info', 'relationships'].includes(selectedTab);
    const mainClass = `entity-viewer ${hasHeader ? 'with-header' : ''} ${
      user.get('_id') && includeFooter ? 'with-footer' : ''
    } ${panelOpen ? 'with-panel' : ''}`;

    return (
      <div className="row">
        <Helmet>
          <title>{entity.get('title') ? entity.get('title') : 'Entity'}</title>
        </Helmet>

        {selectedTab !== 'page' && (
          <div className="content-header content-header-entity">
            <div className="content-header-title">
              <PropertyIcon
                className="item-icon item-icon-center"
                data={entity.get('icon')}
                size="sm"
              />
              <h1 className="item-name">{entity.get('title')}</h1>
              <TemplateLabel template={entity.get('template')} />
            </div>
          </div>
        )}

        <main className={mainClass}>
          <Tabs selectedTab={selectedTab}>
            {hasPageView && (
              <TabContent for="page">
                <PageViewer setBrowserTitle={false} />
              </TabContent>
            )}
            <TabContent
              for={selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none'}
            >
              <div className="entity-metadata">
                {(() => {
                  if (entityBeingEdited) {
                    return <EntityForm highlightedProps={copyFromProps} />;
                  }
                  return (
                    <div>
                      <ShowMetadata
                        relationships={relationships}
                        entity={rawEntity}
                        showTitle={false}
                        showType={false}
                        groupGeolocations
                      />
                      <FileList files={rawEntity.documents} entity={rawEntity} />
                      <AttachmentsList
                        attachments={rawEntity.attachments}
                        parentId={entity.get('_id')}
                        parentSharedId={entity.get('sharedId')}
                        entityView
                        processed={entity.get('processed')}
                      />
                    </div>
                  );
                })()}
              </div>
            </TabContent>
            <TabContent for="relationships">
              <ConnectionsList deleteConnection={this.deleteConnection} searchCentered />
            </TabContent>
            {this.props.newRelationshipsEnabled && (
              <TabContent for="newrelationships">
                <V2NewRelationshipsBoard sharedId={entity.get('sharedId')} />
              </TabContent>
            )}
          </Tabs>
        </main>

        {user.get('_id') && (
          <>
            <ShowIf if={selectedTab === 'info' || selectedTab === 'attachments'}>
              <div className={`entity-footer ${panelOpen ? 'with-sidepanel' : ''}`}>
                <MetadataFormButtons
                  includeViewButton={false}
                  delete={this.deleteEntity}
                  data={this.props.entity}
                  formStatePath="entityView.entityForm"
                  entityBeingEdited={entityBeingEdited}
                  copyFrom={this.toggleCopyFrom}
                />
              </div>
            </ShowIf>

            <ShowIf if={selectedTab === 'relationships'}>
              <div className={`entity-footer ${panelOpen ? 'with-sidepanel' : ''}`}>
                <RelationshipsFormButtons />
              </div>
            </ShowIf>
          </>
        )}

        <SidePanel className={`entity-relationships entity-${selectedTab}`} open={panelOpen}>
          <div className="sidepanel-header">
            <button
              type="button"
              className="closeSidepanel close-modal"
              onClick={this.closePanel.bind(this)}
              aria-label="Close side panel"
            >
              <Icon icon="times" />
            </button>
            <Tabs
              className="content-header-tabs"
              selectedTab={selectedTab}
              handleSelect={tabName => {
                this.props.showTab(tabName);
              }}
            >
              <ul className="nav nav-tabs">
                {hasPageView && (
                  <li>
                    <TabLink
                      to="page"
                      role="button"
                      tabIndex="0"
                      aria-label={t('System', 'Page', null, false)}
                      component="div"
                    >
                      <I18NLink
                        className={this.linkClassNames(['page'])}
                        to={`/entity/${rawEntity.sharedId}/page`}
                      >
                        <Icon icon="file-image" />
                        <span className="tab-link-tooltip">{t('System', 'Page')}</span>
                      </I18NLink>
                    </TabLink>
                  </li>
                )}
                <li>
                  <TabLink
                    to="info"
                    role="button"
                    tabIndex="0"
                    aria-label={t('System', 'Info', null, false)}
                    component="div"
                  >
                    <I18NLink
                      className={this.linkClassNames(['info', ''])}
                      to={`/entity/${rawEntity.sharedId}/info`}
                    >
                      <Icon icon="info-circle" />
                      <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                    </I18NLink>
                  </TabLink>
                </li>
                <li>
                  <TabLink
                    to="relationships"
                    role="button"
                    tabIndex="0"
                    aria-label={t('System', 'Relationships', null, false)}
                    component="div"
                  >
                    <I18NLink
                      className={this.linkClassNames(['relationships'])}
                      to={`/entity/${rawEntity.sharedId}/relationships`}
                    >
                      <Icon icon="exchange-alt" />
                      <span className="connectionsNumber">{summary.totalConnections}</span>
                      <span className="tab-link-tooltip">{t('System', 'Relationships')}</span>
                    </I18NLink>
                  </TabLink>
                </li>
                {this.props.newRelationshipsEnabled && (
                  <li>
                    <TabLink
                      to="newrelationships"
                      role="button"
                      tabIndex="0"
                      aria-label="New Relationships"
                      component="div"
                    >
                      <I18NLink
                        className={this.linkClassNames(['newrelationships'])}
                        to={`/entity/${rawEntity.sharedId}/newrelationships`}
                      >
                        <Icon icon="exchange-alt" />*
                        <span className="tab-link-tooltip" no-translate>
                          New Relationships
                        </span>
                      </I18NLink>
                    </TabLink>
                  </li>
                )}
              </ul>
            </Tabs>
          </div>
          <ShowIf if={selectedTab === 'info' || selectedTab === 'relationships'}>
            <div className="sidepanel-footer">
              <ResetSearch />
            </div>
          </ShowIf>

          <div className="sidepanel-body">
            <Tabs selectedTab={selectedTab}>
              <TabContent
                for={['info', 'relationships', 'page'].includes(selectedTab) ? selectedTab : 'none'}
              >
                <ConnectionsGroups />
              </TabContent>
            </Tabs>
          </div>
        </SidePanel>
        <SidePanel className="copy-from-panel" open={copyFrom}>
          <div className="sidepanel-body">
            <CopyFromEntity
              originalEntity={this.props.entity.toJS()}
              templates={this.props.templates}
              onSelect={this.onCopyFromSelect}
              formModel="entityView.entityForm"
              onCancel={this.toggleCopyFrom}
            />
          </div>
        </SidePanel>

        <ContextMenu
          align={`bottom${includeFooter ? '-with-footer' : ''}`}
          overrideShow
          show={!panelOpen}
          className="show-info-sidepanel-context-menu"
        >
          <ShowSidepanelMenu
            className="show-info-sidepanel-menu"
            panelIsOpen={panelOpen}
            openPanel={this.openPanel}
          />
        </ContextMenu>

        <CreateConnectionPanel
          className="entity-create-connection-panel"
          containerId={entity.sharedId}
          onCreate={this.props.connectionsChanged}
        />
        <AddEntitiesPanel />
        <RelationshipMetadata />
      </div>
    );
  }
}

EntityViewer.defaultProps = {
  relationships: Immutable.fromJS([]),
  entityBeingEdited: false,
  tab: 'info',
  hasPageView: false,
  user: Immutable.fromJS({}),
  locale: 'en',
  // v2
  newRelationshipsEnabled: false,
};

EntityViewer.propTypes = {
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  relationships: PropTypes.instanceOf(Immutable.List),
  entity: PropTypes.instanceOf(Immutable.Map).isRequired,
  entityBeingEdited: PropTypes.bool,
  connectionsGroups: PropTypes.object,
  relationTypes: PropTypes.array,
  deleteEntity: PropTypes.func.isRequired,
  connectionsChanged: PropTypes.func,
  deleteConnection: PropTypes.func,
  startNewConnection: PropTypes.func,
  tab: PropTypes.string,
  library: PropTypes.object,
  locale: PropTypes.string,
  showTab: PropTypes.func.isRequired,
  hasPageView: PropTypes.bool,
  user: PropTypes.instanceOf(Immutable.Map),
  params: PropTypes.object,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
  navigate: PropTypes.func,
  // v2
  newRelationshipsEnabled: PropTypes.bool,
};

const selectRelationTypes = createSelector(
  s => s.relationTypes,
  r => r.toJS()
);

const mapStateToProps = state => {
  const entityTemplateId = state.entityView.entity && state.entityView.entity.get('template');
  const entityTemplate = state.templates.find(template => template.get('_id') === entityTemplateId);
  const templateWithPageView = entityTemplate.get('entityViewPage');
  const defaultTab = templateWithPageView ? 'page' : 'info';
  const { uiState } = state.entityView;
  return {
    entity: state.entityView.entity,
    relationTypes: selectRelationTypes(state),
    templates: state.templates,
    relationships: state.entityView.entity.get('relations'),
    connectionsGroups: state.relationships.list.connectionsGroups,
    entityBeingEdited: !!state.entityView.entityForm._id,
    tab: uiState.get('userSelectedTab') ? uiState.get('tab') : defaultTab,
    hasPageView: Boolean(templateWithPageView),
    user: state.user,
    locale: state.locale,
    // Is this used at all?
    library: state.library,
    // v2
    newRelationshipsEnabled: state.settings?.collection?.get('features')?.get('newRelationships'),
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      deleteEntity,
      connectionsChanged,
      deleteConnection,
      showTab,
      startNewConnection: connectionsActions.startNewConnection,
    },
    dispatch
  );
}

export { EntityViewer, mapStateToProps };
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(withContext(EntityViewer)));
