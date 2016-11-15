// ENTIRE COMPONENT IS UNTESTED!!!!
// There is partial testing of added functionality, but this requires a full test.
import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';

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

  conformGroupData(connectionType, groupedReferences, options) {
    let {key, connectionLabel, templateLabel} = options;
    let groupData = groupedReferences.find(ref => ref.key === key);

    if (!groupData) {
      groupData = {key, connectionType, connectionLabel, templateLabel, refs: []};
      groupedReferences.push(groupData);
    }

    return groupData;
  }

  getGroupData(reference, groupedReferences) {
    const referenceTemplate = this.props.templates
                              .find(t => t._id === reference.connectedDocumentTemplate);

    if (reference.sourceType === 'metadata') {
      return this.conformGroupData('metadata', groupedReferences, {
        key: reference.sourceProperty + '-' + reference.connectedDocumentTemplate,
        connectionLabel: referenceTemplate
                         .properties
                         .find(p => p.name === reference.sourceProperty)
                         .label,
        templateLabel: referenceTemplate.name
      });
    }

    if (reference.sourceType !== 'metadata') {
      return this.conformGroupData('connection', groupedReferences, {
        key: reference.relationType,
        connectionLabel: this.props.relationTypes.find(r => r._id === reference.relationType).name
      });
    }
  }

  groupReferences() {
    const references = this.props.references.toJS();

    const groupedReferences = [];
    references.forEach((reference) => {
      const groupData = this.getGroupData(reference, groupedReferences);
      groupData.refs.push(reference);
    });

    return groupedReferences;
  }
  // --

  render() {
    const {entity, entityBeingEdited, tab} = this.props;
    const selectedTab = tab || 'references';
    const references = this.props.references.toJS();
    const attachments = entity.attachments ? entity.attachments : [];

    return (
      <div className="row entity-content">
        <Helmet title={entity.title ? entity.title : 'Entity'} />
        <aside className="side-panel entity-metadata">
          <MetadataFormButtons
            delete={this.deleteEntity.bind(this)}
            data={this.props.rawEntity}
            formStatePath='entityView.entityForm'
            entityBeingEdited={entityBeingEdited}/>

          <div className="sidepanel-body">
            <div className="document">
              <ShowIf if={!entityBeingEdited}>
                <div className="item-info">
                  <Icon className="item-icon item-icon-center" data={entity.icon} size="sm"/>
                  <h1 className="item-name">{entity.title}</h1>
                  <TemplateLabel template={entity.template}/>
                </div>
              </ShowIf>
              {(() => {
                if (entityBeingEdited) {
                  return <EntityForm/>;
                }
                return <ShowMetadata entity={entity} showTitle={false} showType={false} />;
              })()}
            </div>
          </div>
        </aside>
        <aside className="side-panel entity-connections">

          <div className="sidepanel-header">
            <Tabs selectedTab={selectedTab}
                  handleSelect={tabName => {
                    this.props.showTab(tabName);
                  }}>
              <ul className="nav nav-tabs">
                <li>
                  <TabLink to="references">
                    <i className="fa fa-share-alt"></i>
                    <span className="connectionsNumber">{references.length}</span>
                  </TabLink>
                </li>
                <li>
                  <TabLink to="attachments">
                    <i className="fa fa-download"></i>
                    <span className="connectionsNumber">{attachments.length}</span>
                  </TabLink>
                </li>
              </ul>
            </Tabs>
            &nbsp;
          </div>

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
              <TabContent for="references">
                <div className="sort-by">
                  <SortButtons stateProperty="entityView.sort" />
                </div>
                {this.groupReferences(references).map(group =>
                  <ReferencesGroup key={group.key}
                                   group={Immutable(group)}
                                   deleteReference={this.deleteReference.bind(this)} />
                )}
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
  references: PropTypes.object,
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

const selectTemplates = createSelector(s => s.templates, t => t.toJS());
const selectThesauris = createSelector(s => s.thesauris, t => t.toJS());
const selectRelationTypes = createSelector(s => s.relationTypes, r => r.toJS());
const prepareMetadata = createSelector(
  selectEntity,
  selectTemplates,
  selectThesauris,
  (entity, templates, thesauris) => formater.prepareMetadata(entity, templates, thesauris)
);
const selectReferences = createSelector(
  s => !!s.user.get('_id'),
  s => s.entityView.references,
  (loged, references) => references.filter(ref => loged || ref.get('connectedDocumentPublished'))
);

const mapStateToProps = (state) => {
  return {
    rawEntity: state.entityView.entity,
    templates: selectTemplates(state),
    relationTypes: selectRelationTypes(state),
    entity: prepareMetadata(state),
    references: selectReferences(state),
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
