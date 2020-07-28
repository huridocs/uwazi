import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { Icon } from 'UI';

import { ShowMetadata, MetadataFormButtons, MetadataForm, actions } from 'app/Metadata';
import SidePanel from 'app/Layout/SidePanel';
import { CopyFromEntity } from 'app/Metadata/components/CopyFromEntity';
import { saveEntity } from 'app/Library/actions/libraryActions';
import {
  unselectConnection,
  updateRelationshipEntityData,
  selectConnection,
} from '../actions/actions';

export class RelationshipMetadata extends Component {
  constructor(props) {
    super(props);
    this.state = { copyFrom: false, copyFromProps: [] };

    this.toggleCopyFrom = this.toggleCopyFrom.bind(this);
    this.onCopyFromSelect = this.onCopyFromSelect.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.saveEntity = this.saveEntity.bind(this);
  }

  onCopyFromSelect(copyFromProps) {
    this.setState({ copyFromProps });
  }

  deleteDocument() {}

  async saveEntity(entity, formModel) {
    await this.props.saveEntity(entity, formModel);
    this.props.updateRelationshipEntityData(entity);
    this.props.selectConnection(entity);
  }

  toggleCopyFrom() {
    this.setState(currentState => ({
      copyFrom: !currentState.copyFrom,
    }));
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
            onClick={this.props.unselectConnection}
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
            />
          )}
        </div>
      </SidePanel>
    );
  }
}

RelationshipMetadata.defaultProps = {
  selectedConnection: false,
  entityBeingEdited: false,
};

RelationshipMetadata.propTypes = {
  selectedConnection: PropTypes.bool,
  entity: PropTypes.object.isRequired,
  formState: PropTypes.object.isRequired,
  unselectConnection: PropTypes.func.isRequired,
  entityBeingEdited: PropTypes.bool,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  saveEntity: PropTypes.func.isRequired,
  updateRelationshipEntityData: PropTypes.func.isRequired,
  selectConnection: PropTypes.func.isRequired,
  changeTemplate: PropTypes.func.isRequired,
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
    templates: state.templates,
    formState: state.relationships.metadata,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      unselectConnection,
      saveEntity,
      updateRelationshipEntityData,
      selectConnection,
      changeTemplate: actions.changeTemplate,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipMetadata);
