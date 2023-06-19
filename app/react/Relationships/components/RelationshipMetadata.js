import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions as formActions } from 'react-redux-form';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { Icon } from 'UI';
import { withContext } from 'app/componentWrappers';
import { ShowMetadata, MetadataForm, MetadataFormButtons, actions } from 'app/Metadata';
import { Translate, I18NLink } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { api as entitiesAPI } from 'app/Entities';
import { RequestParams } from 'app/utils/RequestParams';
import { saveEntityWithFiles } from 'app/Library/actions/saveEntityWithFiles';
import { AttachmentsList } from 'app/Attachments';
import { FileList } from 'app/Attachments/components/FileList';
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
    this.props.mainContext.confirm({
      accept: async () => {
        this.props.unselectConnection();
        await entitiesAPI.delete(new RequestParams({ sharedId: this.props.entity.sharedId }));
        await this.props.reloadRelationships(this.props.parentSharedId);
      },
      title: 'Confirm deletion of entity',
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
        templateId={this.props.formMetadata.template}
        onSubmit={this.saveEntity}
        changeTemplate={this.props.changeTemplate}
        highlightedProps={this.state.copyFromProps}
      />
    );

    return this.state.copyFrom ? (
      <div className="tab-content tab-content-visible">
        {form}
        <CopyFromEntity
          originalEntity={this.props.formMetadata}
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
      <>
        <ShowMetadata entity={this.props.entity} showTitle showType />
        <FileList entity={this.props.entity} files={this.props.entity.documents} readonly />
        <AttachmentsList
          entity={this.props.entity}
          attachments={this.props.entity.attachments}
          readOnly
        />
      </>
    );
  }

  renderButtons() {
    if (this.props.entityBeingEdited) {
      return (
        <MetadataFormButtons
          data={Immutable.fromJS(this.props.entity)}
          delete={this.deleteDocument}
          formStatePath="relationships.metadata"
          formState={this.props.formState}
          entityBeingEdited={this.props.entityBeingEdited}
          copyFrom={this.toggleCopyFrom}
          hideDelete={this.props.hubsBeingEdited}
          includeViewButton={false}
        />
      );
    }
    return (
      <I18NLink
        to={`entity/${this.props.entity.sharedId}`}
        className="btn btn-default"
        tabIndex="0"
      >
        <Icon icon="file" />
        <span className="btn-label">
          <Translate>View</Translate>
        </span>
      </I18NLink>
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
        <div className="sidepanel-footer">{this.renderButtons()}</div>
      </SidePanel>
    );
  }
}

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
  formMetadata: PropTypes.object.isRequired,
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
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
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
    formMetadata: state.relationships.metadata,
    formState: state.relationships.formState,
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

export default connect(mapStateToProps, mapDispatchToProps)(withContext(RelationshipMetadata));
