// ENTIRE COMPONENT IS UNTESTED!!!!
// There is partial testing of added functionality, but this requires a full test.
import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';
import {t} from 'app/I18N';

import {formater, ShowMetadata} from 'app/Metadata';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import {browserHistory} from 'react-router';
import {deleteEntity, referencesChanged, deleteConnection, resetSearch} from '../actions/actions';
import {showTab} from '../actions/uiActions';
import {CreateConnectionPanel} from 'app/Connections';
import {actions as connectionsActions} from 'app/Connections';
import EntityForm from '../containers/EntityForm';
import {MetadataFormButtons} from 'app/Metadata';
import {TemplateLabel, Icon} from 'app/Layout';
import SearchBar from './SearchBar';
import ReferencesGroup from './ReferencesGroup';
import ReferencesList from './ReferencesList';

import {createSelector} from 'reselect';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import {AttachmentsList, UploadAttachment} from 'app/Attachments';

export class EntityViewer extends Component {

  deleteEntity() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntity(this.props.rawEntity.toJS())
        .then(() => {
          browserHistory.push('/');
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
        summaryData.referencesTemplates.push(template.get('_id'));
        summaryData.totalReferences += template.get('count');
      });
      return summaryData;
    }, {referencesTemplates: [], totalReferences: 0});

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
                <TabLink to="references">
                  <i className="fa fa-exchange"></i>
                  <span className="connectionsNumber">{summary.totalReferences}</span>
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
            <TabContent for="references">
              <ReferencesList entity={this.props.entity} deleteConnection={this.deleteConnection.bind(this)} />
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

        <aside className="side-panel entity-connections">
          <ShowIf if={selectedTab === 'info' || selectedTab === 'references'}>
            <div className="sidepanel-footer">
              <ShowIf if={Boolean(connectionsGroups.size)}>
                <button onClick={this.props.resetSearch}
                        className="create-connection btn btn-primary">
                  <i className="fa fa-refresh"></i>
                  <span className="btn-label">{t('System', 'Reset')}</span>
                </button>
              </ShowIf>
              <NeedAuthorization>
                <button onClick={this.props.startNewConnection.bind(null, 'basic', entity.sharedId)}
                        className="create-connection btn btn-success">
                  <i className="fa fa-plus"></i>
                  <span className="btn-label">New</span>
                </button>
              </NeedAuthorization>
            </div>
          </ShowIf>

          <NeedAuthorization>
            <ShowIf if={this.props.tab === 'attachments'}>
              <div className="sidepanel-footer">
                <UploadAttachment entityId={entity._id}/>
              </div>
            </ShowIf>
          </NeedAuthorization>

          <div className="sidepanel-body">
            <Tabs selectedTab={selectedTab}>
              <TabContent for={selectedTab === 'info' || selectedTab === 'references' ? selectedTab : 'none'}>
                <ShowIf if={Boolean(connectionsGroups.size)}>
                  <div>
                    <SearchBar />
                    <div className="nested-selector">
                      <ul className="multiselect is-active">
                        {connectionsGroups.map(group =>
                          <ReferencesGroup key={group.get('key')}
                                           group={group} />
                        )}
                      </ul>
                    </div>
                  </div>
                </ShowIf>
              </TabContent>
              <TabContent for="attachments">
                <AttachmentsList files={Immutable(attachments)}
                                 parentId={entity._id} />
              </TabContent>
            </Tabs>
          </div>

        </aside>

        <CreateConnectionPanel containerId={entity.sharedId} onCreate={this.props.referencesChanged}/>

      </div>
    );
  }
}

EntityViewer.propTypes = {
  entity: PropTypes.object,
  rawEntity: PropTypes.object,
  entityBeingEdited: PropTypes.bool,
  connectionsGroups: PropTypes.object,
  templates: PropTypes.array,
  relationTypes: PropTypes.array,
  deleteEntity: PropTypes.func,
  referencesChanged: PropTypes.func,
  deleteConnection: PropTypes.func,
  startNewConnection: PropTypes.func,
  resetSearch: PropTypes.func,
  tab: PropTypes.string,
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
    tab: state.entityView.uiState.get('tab')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    deleteEntity,
    referencesChanged,
    deleteConnection,
    showTab,
    resetSearch,
    startNewConnection: connectionsActions.startNewConnection
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityViewer);
