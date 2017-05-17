import PropTypes from 'prop-types';
// ENTIRE COMPONENT IS UNTESTED!!!!
// There is partial testing of added functionality, but this requires a full test.
import React, {Component} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';
import {t} from 'app/I18N';

import {formater, ShowMetadata} from 'app/Metadata';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import {browserHistory} from 'react-router';
import {deleteEntity} from '../actions/actions';
import {showTab} from '../actions/uiActions';
import {CreateConnectionPanel} from 'app/Connections';
import {actions as connectionsActions} from 'app/Connections';
import {ConnectionsGroups, ConnectionsList, ResetSearch} from 'app/ConnectionsList';
import {connectionsChanged, deleteConnection} from 'app/ConnectionsList/actions/actions';
import EntityForm from '../containers/EntityForm';
import {MetadataFormButtons} from 'app/Metadata';
import {TemplateLabel, Icon} from 'app/Layout';
import SidePanel from 'app/Layout/SidePanel';

import {createSelector} from 'reselect';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import {AttachmentsList, UploadAttachment} from 'app/Attachments';

export class EntityViewer extends Component {

  deleteEntity() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntity(this.props.rawEntity.toJS())
        .then(() => {
          browserHistory.goBack();
        });
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this entity?'
    });
  }

  // TESTED -----
  deleteConnection(reference) {
    if (reference.sourceType !== 'metadata') {
      this.context.confirm({
        accept: () => {
          this.props.deleteConnection(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?'
      });
    }
  }
  // --

  render() {
    const {entity, entityBeingEdited, tab, connectionsGroups} = this.props;
    const selectedTab = tab || 'info';
    const attachments = entity.attachments ? entity.attachments : [];

    const summary = connectionsGroups.reduce((summaryData, g) => {
      g.get('templates').forEach(template => {
        summaryData.totalConnections += template.get('count');
      });
      return summaryData;
    }, {totalConnections: 0});

    return (
      <div className="row entity-content">
        <Helmet title={entity.title ? entity.title : 'Entity'} />

        <div className="content-header content-header-entity">
          <div className="content-header-title">
            <Icon className="item-icon item-icon-center" data={entity.icon} size="sm"/>
            <h1 className="item-name">{entity.title}</h1>
            <TemplateLabel template={entity.template}/>
          </div>

          <Tabs className="content-header-tabs" selectedTab={selectedTab}
                handleSelect={tabName => {
                  this.props.showTab(tabName);
                }}>
            <ul className="nav nav-tabs">
              <li>
                <TabLink to="info">
                  <i className="fa fa-info-circle"></i>
                  <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="connections">
                  <i className="fa fa-exchange"></i>
                  <span className="connectionsNumber">{summary.totalConnections}</span>
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

        <main className="entity-viewer">

          <Tabs selectedTab={selectedTab}>
            <TabContent for={selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none'}>
              <div className="document">
                {(() => {
                  if (entityBeingEdited) {
                    return <EntityForm/>;
                  }
                  return <ShowMetadata entity={entity} showTitle={false} showType={false} />;
                })()}
              </div>
            </TabContent>
            <TabContent for="connections">
              <ConnectionsList deleteConnection={this.deleteConnection.bind(this)} />
            </TabContent>
          </Tabs>
        </main>

        <ShowIf if={selectedTab === 'info' || selectedTab === 'attachments'}>
          <MetadataFormButtons
            delete={this.deleteEntity.bind(this)}
            data={this.props.rawEntity}
            formStatePath='entityView.entityForm'
            entityBeingEdited={entityBeingEdited} />
        </ShowIf>

        <SidePanel className={"entity-connections entity-" + this.props.tab} open={this.props.sidepanelOpen}>
          <ShowIf if={selectedTab === 'info' || selectedTab === 'connections'}>
            <div className="sidepanel-footer">
              <ResetSearch />
              <NeedAuthorization roles={['admin', 'editor']}>
                <button onClick={this.props.startNewConnection.bind(null, 'basic', entity.sharedId)}
                        className="create-connection btn btn-success">
                  <i className="fa fa-plus"></i>
                  <span className="btn-label">New</span>
                </button>
              </NeedAuthorization>
            </div>
          </ShowIf>

          <NeedAuthorization roles={['admin', 'editor']}>
            <ShowIf if={this.props.tab === 'attachments'}>
              <div className="sidepanel-footer">
                <UploadAttachment entityId={entity._id}/>
              </div>
            </ShowIf>
          </NeedAuthorization>

          <div className="sidepanel-body">
            <Tabs selectedTab={selectedTab}>
              <TabContent for={selectedTab === 'info' || selectedTab === 'connections' ? selectedTab : 'none'}>
                <ConnectionsGroups />
              </TabContent>
              <TabContent for="attachments">
                <AttachmentsList files={Immutable(attachments)}
                                 parentId={entity._id} />
              </TabContent>
            </Tabs>
          </div>

        </SidePanel>

        <CreateConnectionPanel containerId={entity.sharedId} onCreate={this.props.connectionsChanged}/>

      </div>
    );
  }
}

EntityViewer.propTypes = {
  entity: PropTypes.object,
  rawEntity: PropTypes.object,
  entityBeingEdited: PropTypes.bool,
  sidepanelOpen: PropTypes.bool,
  connectionsGroups: PropTypes.object,
  templates: PropTypes.array,
  relationTypes: PropTypes.array,
  deleteEntity: PropTypes.func,
  connectionsChanged: PropTypes.func,
  deleteConnection: PropTypes.func,
  startNewConnection: PropTypes.func,
  tab: PropTypes.string,
  library: PropTypes.object,
  showTab: PropTypes.func
};

EntityViewer.contextTypes = {
  confirm: PropTypes.func
};

const selectEntity = createSelector(
  state => state.entityView.entity,
  entity => entity.toJS()
);

const selectTemplates = createSelector(s => s.templates, template => template.toJS());
const selectThesauris = createSelector(s => s.thesauris, thesauri => thesauri.toJS());
const selectRelationTypes = createSelector(s => s.relationTypes, r => r.toJS());
const prepareMetadata = createSelector(
  selectEntity,
  selectTemplates,
  selectThesauris,
  (entity, templates, thesauris) => formater.prepareMetadata(entity, templates, thesauris)
);

const mapStateToProps = (state) => {
  return {
    rawEntity: state.entityView.entity,
    templates: selectTemplates(state),
    relationTypes: selectRelationTypes(state),
    entity: prepareMetadata(state),
    connectionsGroups: state.connectionsList.connectionsGroups,
    entityBeingEdited: !!state.entityView.entityForm._id,
    tab: state.entityView.uiState.get('tab'),
    library: state.library,
    sidepanelOpen: state.entityView.uiState.get('tab') === 'attachments'
    || state.entityView.uiState.get('showFilters') && state.entityView.uiState.get('tab') === 'connections'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    deleteEntity,
    connectionsChanged,
    deleteConnection,
    showTab,
    startNewConnection: connectionsActions.startNewConnection
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityViewer);
