import { fromJS as Immutable } from 'immutable';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import { bindActionCreators } from 'redux';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { AttachmentsList } from 'app/Attachments';
import { ConnectionsGroups, ConnectionsList, ResetSearch } from 'app/ConnectionsList';
import { CreateConnectionPanel, actions as connectionsActions } from 'app/Connections';
import { MetadataFormButtons, ShowMetadata } from 'app/Metadata';
import { RelationshipsFormButtons } from 'app/Relationships';
import { TemplateLabel, Icon as PropertyIcon } from 'app/Layout';
import { connectionsChanged, deleteConnection } from 'app/ConnectionsList/actions/actions';
import { t } from 'app/I18N';
import AddEntitiesPanel from 'app/Relationships/components/AddEntities';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import ShowIf from 'app/App/ShowIf';
import SidePanel from 'app/Layout/SidePanel';
import ContextMenu from 'app/ContextMenu';
import { Icon } from 'UI';
import { FileList } from 'app/Attachments/components/FileList';

import { ShowSidepanelMenu } from './ShowSidepanelMenu';
import { deleteEntity } from '../actions/actions';
import { showTab } from '../actions/uiActions';
import EntityForm from '../containers/EntityForm';

export class EntityViewer extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      panelOpen: true,
    };
    this.deleteEntity = this.deleteEntity.bind(this);
    this.closePanel = this.closePanel.bind(this);
    this.openPanel = this.openPanel.bind(this);
  }

  deleteEntity() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntity(this.props.rawEntity.toJS()).then(() => {
          browserHistory.goBack();
        });
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this entity?',
    });
  }

  deleteConnection(reference) {
    if (reference.sourceType !== 'metadata') {
      this.context.confirm({
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

  render() {
    const { entity, entityBeingEdited, tab, connectionsGroups, relationships } = this.props;
    const { panelOpen } = this.state;
    const selectedTab = tab || 'info';

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
      <div className="row">
        <Helmet title={entity.title ? entity.title : 'Entity'} />

        <div className="content-header content-header-entity">
          <div className="content-header-title">
            <PropertyIcon className="item-icon item-icon-center" data={entity.icon} size="sm" />
            <h1 className="item-name">{entity.title}</h1>
            <TemplateLabel template={entity.template} />
          </div>
        </div>

        <main className={`entity-viewer ${panelOpen ? 'with-panel' : ''}`}>
          <Tabs selectedTab={selectedTab}>
            <TabContent
              for={selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none'}
            >
              <div className="entity-metadata">
                {(() => {
                  if (entityBeingEdited) {
                    return <EntityForm />;
                  }
                  return (
                    <div>
                      <ShowMetadata
                        relationships={relationships}
                        entity={entity}
                        showTitle={false}
                        showType={false}
                      />
                      <FileList files={entity.documents} entity={entity} />
                      <AttachmentsList
                        attachments={entity.attachments}
                        parentId={entity._id}
                        parentSharedId={entity.sharedId}
                        entityView
                        processed={entity.processed}
                      />
                    </div>
                  );
                })()}
              </div>
            </TabContent>
            <TabContent for="connections">
              <ConnectionsList deleteConnection={this.deleteConnection.bind(this)} searchCentered />
            </TabContent>
          </Tabs>
        </main>

        <ShowIf if={selectedTab === 'info' || selectedTab === 'attachments'}>
          <div className="sidepanel-footer">
            <MetadataFormButtons
              delete={this.deleteEntity.bind(this)}
              data={this.props.rawEntity}
              formStatePath="entityView.entityForm"
              entityBeingEdited={entityBeingEdited}
            />
          </div>
        </ShowIf>

        <ShowIf if={selectedTab === 'connections'}>
          <div className="sidepanel-footer">
            <RelationshipsFormButtons />
          </div>
        </ShowIf>

        <SidePanel className={`entity-connections entity-${this.props.tab}`} open={panelOpen}>
          <div className="sidepanel-header">
            <button
              type="button"
              className="closeSidepanel close-modal"
              onClick={this.closePanel.bind(this)}
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
                <li>
                  <TabLink to="info">
                    <Icon icon="info-circle" />
                    <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                  </TabLink>
                </li>
                <li>
                  <TabLink to="connections">
                    <Icon icon="exchange-alt" />
                    <span className="connectionsNumber">{summary.totalConnections}</span>
                    <span className="tab-link-tooltip">{t('System', 'Connections')}</span>
                  </TabLink>
                </li>
              </ul>
            </Tabs>
          </div>
          <ShowIf if={selectedTab === 'info' || selectedTab === 'connections'}>
            <div className="sidepanel-footer">
              <ResetSearch />
            </div>
          </ShowIf>

          <div className="sidepanel-body">
            <Tabs selectedTab={selectedTab}>
              <TabContent
                for={selectedTab === 'info' || selectedTab === 'connections' ? selectedTab : 'none'}
              >
                <ConnectionsGroups />
              </TabContent>
            </Tabs>
          </div>
        </SidePanel>

        <ContextMenu
          align="bottom"
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
  relationships: Immutable([]),
};

EntityViewer.propTypes = {
  entity: PropTypes.object,
  relationships: PropTypes.object,
  rawEntity: PropTypes.object,
  entityBeingEdited: PropTypes.bool,
  sidepanelOpen: PropTypes.bool,
  connectionsGroups: PropTypes.object,
  relationTypes: PropTypes.array,
  deleteEntity: PropTypes.func,
  connectionsChanged: PropTypes.func,
  deleteConnection: PropTypes.func,
  startNewConnection: PropTypes.func,
  tab: PropTypes.string,
  library: PropTypes.object,
  showTab: PropTypes.func,
};

EntityViewer.contextTypes = {
  confirm: PropTypes.func,
};

const selectEntity = createSelector(
  state => state.entityView.entity,
  entity => entity.toJS()
);

const selectRelationTypes = createSelector(
  s => s.relationTypes,
  r => r.toJS()
);

const mapStateToProps = state => ({
  rawEntity: state.entityView.entity,
  relationTypes: selectRelationTypes(state),
  entity: selectEntity(state),
  relationships: state.entityView.entity.get('relationships'),
  connectionsGroups: state.relationships.list.connectionsGroups,
  entityBeingEdited: !!state.entityView.entityForm._id,
  tab: state.entityView.uiState.get('tab'),
  library: state.library,
});

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

export default connect(mapStateToProps, mapDispatchToProps)(EntityViewer);
