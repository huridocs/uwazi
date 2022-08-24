import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions as formActions } from 'react-redux-form';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { Icon } from 'UI';

import { ShowMetadata, MetadataFormButtons, MetadataForm, actions } from 'app/Metadata';
import SidePanel from 'app/Layout/SidePanel';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { api as entitiesAPI } from 'app/Entities';
import { RequestParams } from 'app/utils/RequestParams';
import { saveEntityWithFiles } from 'app/Library/actions/saveEntityWithFiles';
import {
  unselectConnection,
  updateRelationshipEntityData,
  addEntity,
  setAddToData,
  reloadRelationships,
} from '../actions/actions';

class RelationshipMetadata extends Component {
  constructor(props) {
    super(props);
    this.state = { copyFrom: false, copyFromProps: [] };

    this.toggleCopyFrom = this.toggleCopyFrom.bind(this);
    this.onCopyFromSelect = this.onCopyFromSelect.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.saveEntity = this.saveEntity.bind(this);
    this.closeSidePanel = this.closeSidePanel.bind(this);
  }

  onCopyFromSelect(copyFromProps) {
    this.setState({ copyFromProps });
  }

  async deleteDocument() {
    this.context.confirm({
      accept: async () => {
        this.props.unselectConnection();
        await entitiesAPI.delete(new RequestParams({ sharedId: this.props.entity.sharedId }));
        await this.props.reloadRelationships(this.props.parentSharedId);
      },
      title: 'Confirm delete entity',
      message: 'Are you sure you want to delete this entity?',
    });
  }

  async saveEntity(entity, formModel) {
    this.props.resetForm(formModel);
    this.props.unselectConnection();
    const { entity: savedEntity, errors } = await saveEntityWithFiles(entity);
    this.props.updateRelationshipEntityData(savedEntity);

    if (Number.isInteger(this.props.hubIndex)) {
      this.props.addEntity(
        this.props.hubIndex,
        this.props.rightRelationshipIndex,
        savedEntity,
        errors
      );
      this.props.setAddToData(null, null);
    }
  }

  toggleCopyFrom() {
    this.setState(currentState => ({
      copyFrom: !currentState.copyFrom,
    }));
  }

  closeSidePanel() {
    return this.props.entityBeingEdited
      ? this.props.resetForm('relationships.metadata')
      : this.props.unselectConnection();
  }

  renderForm() {
    const form = (
      <MetadataForm
        model="relationships.metadata"
        initialTemplateId={this.props.entity.template}
        templateId={this.props.formState.template}
        onSubmit={this.saveEntity}
        changeTemplate={this.props.changeTemplate}
        highlightedProps={this.state.copyFromProps}
      />
    );

    return this.state.copyFrom ? (
      <div className="tab-content tab-content-visible">
        {form}
        <CopyFromEntity
          originalEntity={this.props.formState}
          templates={this.props.templates}
          onSelect={this.onCopyFromSelect}
          formModel="relationships.metadata"
          onCancel={this.toggleCopyFrom}
        />
      </div>
    ) : (
      form
    );
  }

  renderBody() {
    return this.props.entityBeingEdited ? (
      this.renderForm()
    ) : (
      <ShowMetadata entity={this.props.entity} showTitle showType />
    );
  }

  render() {
    const twoColumns = this.state.copyFrom ? 'two-columns' : '';
    return (
      <SidePanel
        open={this.props.selectedConnection}
        className={`connections-metadata ${twoColumns}`}
      >
        {!this.state.copyFrom && (
          <button
            type="button"
            className="closeSidepanel close-modal"
            onClick={this.closeSidePanel}
          >
            <Icon icon="times" />
          </button>
        )}
        <div className="sidepanel-body">{this.renderBody()}</div>
        <div className="sidepanel-footer">
          {!this.state.copyFrom && (
            <MetadataFormButtons
              data={Immutable.fromJS(this.props.entity)}
              delete={this.deleteDocument}
              formStatePath="relationships.metadata"
              entityBeingEdited={this.props.entityBeingEdited}
              copyFrom={this.toggleCopyFrom}
              hideDelete={this.props.hubsBeingEdited}
              includeViewButton={false}
            />
          )}
        </div>
      </SidePanel>
    );
  }
}

RelationshipMetadata.contextTypes = {
  confirm: PropTypes.func,
};

RelationshipMetadata.defaultProps = {
  selectedConnection: false,
  entityBeingEdited: false,
  hubsBeingEdited: false,
  hubIndex: null,
  rightRelationshipIndex: null,
};

RelationshipMetadata.propTypes = {
  selectedConnection: PropTypes.bool,
  entity: PropTypes.object.isRequired,
  formState: PropTypes.object.isRequired,
  unselectConnection: PropTypes.func.isRequired,
  entityBeingEdited: PropTypes.bool,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  updateRelationshipEntityData: PropTypes.func.isRequired,
  changeTemplate: PropTypes.func.isRequired,
  hubIndex: PropTypes.number,
  rightRelationshipIndex: PropTypes.number,
  addEntity: PropTypes.func.isRequired,
  setAddToData: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  hubsBeingEdited: PropTypes.bool,
  parentSharedId: PropTypes.string.isRequired,
  reloadRelationships: PropTypes.func.isRequired,
};

const connectionSelector = createSelector(
  state => state.relationships.connection,
  entity => (entity && entity.toJS ? entity.toJS() : { metadata: {} })
);

const mapStateToProps = state => {
  const entityBeingEdited = Boolean(state.relationships.metadata.metadata);

  return {
    selectedConnection: Boolean(
      (state.relationships.connection && state.relationships.connection.get('_id')) ||
        entityBeingEdited
    ),
    entity: connectionSelector(state),
    entityBeingEdited,
    hubsBeingEdited: Boolean(state.relationships.hubActions.get('editing')),
    templates: state.templates,
    formState: state.relationships.metadata,
    hubIndex: state.relationships.hubActions.getIn(['addTo', 'hubIndex']),
    rightRelationshipIndex: state.relationships.hubActions.getIn([
      'addTo',
      'rightRelationshipIndex',
    ]),
    parentSharedId: state.relationships.list.sharedId,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      unselectConnection,
      updateRelationshipEntityData,
      changeTemplate: actions.changeTemplate,
      addEntity,
      setAddToData,
      resetForm: formActions.reset,
      reloadRelationships,
    },
    dispatch
  );
}

export { RelationshipMetadata, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipMetadata);
