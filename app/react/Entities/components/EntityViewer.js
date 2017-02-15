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
import {deleteEntity, addReference, deleteReference} from '../actions/actions';
import {showTab} from '../actions/uiActions';
import {CreateConnectionPanel} from 'app/Connections';
import {actions as connectionsActions} from 'app/Connections';
import EntityForm from '../containers/EntityForm';
import {MetadataFormButtons} from 'app/Metadata';
import {TemplateLabel, Icon} from 'app/Layout';
import SortButtons from 'app/Library/components/SortButtons';
import ReferencesGroup from './ReferencesGroup';
import {createSelector} from 'reselect';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';

import ReferencesList from './ReferencesList';
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
  deleteReference(reference) {
    if (reference.sourceType !== 'metadata') {
      this.context.confirm({
        accept: () => {
          this.props.deleteReference(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?'
      });
    }
  }
  // --

  render() {
    console.log(this.props.searchResults.toJS());

    const {entity, entityBeingEdited, tab, referenceGroups} = this.props;
    const selectedTab = tab || 'info';
    const attachments = entity.attachments ? entity.attachments : [];

    const summary = referenceGroups.reduce((summaryData, g) => {
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
          <Icon className="item-icon item-icon-center" data={entity.icon} size="sm"/>
          <h1 className="item-name">{entity.title}</h1>
          <TemplateLabel template={entity.template}/>

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

        <aside className="side-panel entity-metadata">
          <ShowIf if={selectedTab === 'info' || selectedTab === 'attachments'}>
            <MetadataFormButtons
              delete={this.deleteEntity.bind(this)}
              data={this.props.rawEntity}
              formStatePath='entityView.entityForm'
              entityBeingEdited={entityBeingEdited}
            />
          </ShowIf>

          <div className="sidepanel-body">
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
                <ReferencesList entity={this.props.entity} />
              </TabContent>
            </Tabs>
          </div>
        </aside>

        <aside className="side-panel entity-connections">
          <NeedAuthorization>
            <ShowIf if={selectedTab === 'references'}>
              <div className="sidepanel-footer">
                <button onClick={this.props.startNewConnection.bind(null, 'basic', entity.sharedId)}
                        className="create-connection btn btn-success">
                  <i className="fa fa-plus"></i>
                  <span className="btn-label">New</span>
                </button>
              </div>
            </ShowIf>
          </NeedAuthorization>

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
                <div className="sort-by">
                  <SortButtons stateProperty="entityView.sort"
                               selectedTemplates={Immutable(summary.referencesTemplates)} />
                </div>
                <div className="nested-selector">
                  <ul className="multiselect is-active">
                    {referenceGroups.map(group =>
                      <ReferencesGroup key={group.get('key')}
                                       group={group}
                                       deleteReference={this.deleteReference.bind(this)} />
                    )}
                  </ul>
                </div>
              </TabContent>
              <TabContent for="attachments">
                <AttachmentsList files={Immutable(attachments)}
                                 parentId={entity._id} />
              </TabContent>
            </Tabs>
          </div>

        </aside>

        <CreateConnectionPanel containerId={entity.sharedId} onCreate={this.props.addReference}/>

      </div>
    );
  }
}

EntityViewer.propTypes = {
  entity: PropTypes.object,
  rawEntity: PropTypes.object,
  entityBeingEdited: PropTypes.bool,
  referenceGroups: PropTypes.object,
  searchResults: PropTypes.object,
  templates: PropTypes.array,
  relationTypes: PropTypes.array,
  deleteEntity: PropTypes.func,
  addReference: PropTypes.func,
  deleteReference: PropTypes.func,
  startNewConnection: PropTypes.func,
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

// const selectReferences = createSelector(
//   s => !!s.user.get('_id'),
//   s => s.entityView.references,
//   (loged, references) => references.filter(ref => loged || ref.get('connectedDocumentPublished'))
// );

const mapStateToProps = (state) => {
  return {
    rawEntity: state.entityView.entity,
    templates: selectTemplates(state),
    relationTypes: selectRelationTypes(state),
    entity: prepareMetadata(state),
    referenceGroups: state.entityView.referenceGroups,
    searchResults: state.entityView.searchResults,
    entityBeingEdited: !!state.entityView.entityForm._id,
    tab: state.entityView.uiState.get('tab')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    deleteEntity,
    addReference,
    deleteReference,
    showTab,
    startNewConnection: connectionsActions.startNewConnection
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityViewer);
