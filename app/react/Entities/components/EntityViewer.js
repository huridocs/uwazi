/** @format */

import ShowIf from 'app/App/ShowIf';
import { AttachmentsList } from 'app/Attachments';
import { actions as connectionsActions, CreateConnectionPanel } from 'app/Connections';
import { ConnectionsGroups, ConnectionsList, ResetSearch } from 'app/ConnectionsList';
import { connectionsChanged, deleteConnection } from 'app/ConnectionsList/actions/actions';
import ContextMenu from 'app/ContextMenu';
import { t } from 'app/I18N';
import { Icon as PropertyIcon, TemplateLabel } from 'app/Layout';
import SidePanel from 'app/Layout/SidePanel';
import { MetadataFormButtons, ShowMetadata } from 'app/Metadata';
import { RelationshipsFormButtons } from 'app/Relationships';
import AddEntitiesPanel from 'app/Relationships/components/AddEntities';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import { fromJS as Immutable } from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { Icon } from 'UI';
import { deleteEntity, switchOneUpEntity, toggleOneUpFullEdit } from '../actions/actions';
import { showTab } from '../actions/uiActions';
import EntityForm from '../containers/EntityForm';
import { ShowSidepanelMenu } from './ShowSidepanelMenu';

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
    const {
      entity,
      entityBeingEdited,
      tab,
      connectionsGroups,
      relationships,
      oneUpState,
    } = this.props;
    const { panelOpen } = this.state;
    const selectedTab = tab || 'info';

    const docAttachments = entity.attachments ? entity.attachments : [];
    const attachments = entity.file ? [entity.file].concat(docAttachments) : docAttachments;

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
          <ShowIf if={oneUpState.enabled}>
            <div className="content-header-title">
              {oneUpState.indexInDocs} of {oneUpState.totalDocs}
            </div>
          </ShowIf>
        </div>
        <main className={`entity-viewer ${panelOpen ? 'with-panel' : ''}`}>
          <Tabs selectedTab={selectedTab}>
            <TabContent
              for={selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none'}
            >
              <div className="entity-metadata">
                {entityBeingEdited && (!oneUpState.enabled || oneUpState.fullEdit) ? (
                  <EntityForm showSubset={oneUpState.enabled ? 'no-multiselect' : 'all'} />
                ) : (
                  <div>
                    <ShowMetadata
                      relationships={relationships}
                      entity={entity}
                      showTitle={false}
                      showType={false}
                      showSubset={oneUpState.enabled ? 'no-multiselect' : 'all'}
                    />
                    <AttachmentsList
                      files={Immutable(attachments)}
                      parentId={entity._id}
                      parentSharedId={entity.sharedId}
                      isDocumentAttachments={Boolean(entity.file)}
                      entityView
                      processed={entity.processed}
                    />
                  </div>
                )}
              </div>
            </TabContent>
            <TabContent for="connections">
              <ConnectionsList deleteConnection={this.deleteConnection.bind(this)} searchCentered />
            </TabContent>
          </Tabs>
        </main>
        <ShowIf
          if={!oneUpState.enabled && (selectedTab === 'info' || selectedTab === 'attachments')}
        >
          <div className="sidepanel-footer">
            <MetadataFormButtons
              delete={this.deleteEntity}
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
            <button type="button" className="closeSidepanel close-modal" onClick={this.closePanel}>
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
          <ShowIf
            if={!oneUpState.enabled && (selectedTab === 'info' || selectedTab === 'connections')}
          >
            <div className="sidepanel-footer">
              <ResetSearch />
            </div>
          </ShowIf>
          <ShowIf if={oneUpState.enabled && !this.props.isPristine}>
            <div className="sidepanel-footer">
              <ShowIf if={oneUpState.indexInDocs > 0}>
                <button
                  onClick={() => this.props.switchOneUpEntity(-1, true)}
                  className="delete-metadata btn"
                >
                  <Icon icon="times" />
                  <span className="btn-label">{t('System', 'Save & Previous')}</span>
                </button>
              </ShowIf>
              <button
                onClick={() => this.props.toggleOneUpFullEdit()}
                className="delete-metadata btn btn-primary"
              >
                <Icon icon="times" />
                <span className="btn-label">{t('System', 'Full Edit')}</span>
              </button>
              <button
                onClick={() => this.props.switchOneUpEntity(0, false)}
                className="cancel-edit-metadata btn btn-danger"
              >
                <Icon icon="trash-alt" />
                <span className="btn-label">{t('System', 'Discard')}</span>
              </button>
              <button
                onClick={() => this.props.switchOneUpEntity(+1, true)}
                className="delete-metadata btn btn-primary"
              >
                <Icon icon="times" />
                <span className="btn-label">{t('System', 'Save & Next')}</span>
              </button>
            </div>
          </ShowIf>
          <ShowIf if={oneUpState.enabled && this.props.isPristine}>
            <div className="sidepanel-footer">
              <ShowIf if={oneUpState.indexInDocs > 0}>
                <button
                  onClick={() => this.props.switchOneUpEntity(-1, false)}
                  className="delete-metadata btn"
                >
                  <Icon icon="times" />
                  <span className="btn-label">{t('System', 'Previous')}</span>
                </button>
              </ShowIf>
              <button
                onClick={() => this.props.toggleOneUpFullEdit()}
                className="delete-metadata btn btn-primary"
              >
                <Icon icon="times" />
                <span className="btn-label">{t('System', 'Full Edit')}</span>
              </button>
              <button
                onClick={() => this.props.switchOneUpEntity(+1, false)}
                className="delete-metadata btn btn-primary"
              >
                <Icon icon="times" />
                <span className="btn-label">{t('System', 'Next')}</span>
              </button>
            </div>
          </ShowIf>

          <div className="sidepanel-body">
            <Tabs selectedTab={selectedTab}>
              <TabContent
                for={
                  (!oneUpState.enabled && selectedTab === 'info') || selectedTab === 'connections'
                    ? selectedTab
                    : 'none'
                }
              >
                <ConnectionsGroups />
              </TabContent>
              <TabContent for={oneUpState.enabled && selectedTab === 'info' ? selectedTab : 'none'}>
                <EntityForm showSubset={oneUpState.enabled ? 'only-multiselect' : 'all'} />
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
  oneUpState: {},
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
  isPristine: PropTypes.bool,
  // function(delta (-1, 0, +1) and shouldSave bool) => dispatch => {...}
  switchOneUpEntity: PropTypes.func,
  toggleOneUpFullEdit: PropTypes.func,
  oneUpState: PropTypes.object,
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
  isPristine: state.entityView.entityFormState.$form.pristine,
  oneUpState: state.entityView.oneUpState.toJS(),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      deleteEntity,
      connectionsChanged,
      deleteConnection,
      showTab,
      startNewConnection: connectionsActions.startNewConnection,
      switchOneUpEntity,
      toggleOneUpFullEdit,
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EntityViewer);
