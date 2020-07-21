import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fromJS as Immutable } from 'immutable';
import { createSelector } from 'reselect';
import { Icon } from 'UI';

import { ShowMetadata, MetadataFormButtons, MetadataForm } from 'app/Metadata';
import SidePanel from 'app/Layout/SidePanel';
import { unselectConnection } from '../actions/actions';
import { startNewConnection } from 'app/Connections/actions/actions';

export class RelationshipMetadata extends Component {
  constructor(props) {
    super(props);
    this.deleteDocument = this.deleteDocument.bind(this);
  }

  deleteDocument() {}

  renderBody() {
    return this.props.entityBeingEdited ? (
      <MetadataForm
        model="relationships.metadata"
        initialTemplateId={this.props.entity.template}
        templateId={this.props.entity.template}
      />
    ) : (
      <ShowMetadata entity={this.props.entity} showTitle showType />
    );
  }

  render() {
    return (
      <SidePanel open={this.props.selectedConnection} className="connections-metadata">
        <button
          type="button"
          className="closeSidepanel close-modal"
          onClick={this.props.unselectConnection}
        >
          <Icon icon="times" />
        </button>
        <div className="sidepanel-body">{this.renderBody()}</div>
        <div className="sidepanel-footer">
          <MetadataFormButtons
            data={Immutable(this.props.entity)}
            delete={this.deleteDocument}
            formStatePath="relationships.metadata"
            entityBeingEdited={this.props.entityBeingEdited}
          />
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
  unselectConnection: PropTypes.func.isRequired,
  entityBeingEdited: PropTypes.bool,
};

const connectionSelector = createSelector(
  state => state.relationships.connection,
  entity => (entity && entity.toJS ? entity.toJS() : { metadata: {} })
);

const mapStateToProps = state => {
  console.log(state);

  return {
    selectedConnection: Boolean(
      state.relationships.connection && state.relationships.connection.get('_id')
    ),
    entity: connectionSelector(state),
    entityBeingEdited: Boolean(state.relationships.metadata._id),
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      unselectConnection,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipMetadata);
