import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Map } from 'immutable';
import { Icon } from 'UI';
import Doc from 'app/Library/components/Doc';
import DropdownList from 'react-widgets/lib/DropdownList';
import * as actions from '../actions/actions';
import HubRelationshipMetadata from './HubRelationshipMetadata';

class LeftRelationship extends Component {
  static renderFigure() {
    return (
      <div key="figure" className="hubRelationship">
        <figure />
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.toggelRemoveLeftRelationship = this.props.toggelRemoveLeftRelationship.bind(
      null,
      props.index
    );
    this.onClick = this.onClick.bind(this);
  }

  onClick(_e, entity) {
    this.props.selectConnection(entity);
  }

  renderTrashButton(hub) {
    return (
      this.props.editing && (
        <div key="toggelRemoveLeftRelationship" className="removeHub">
          <button onClick={this.toggelRemoveLeftRelationship} className="relationships-icon">
            <Icon icon={!hub.get('deleted') ? 'trash-alt' : 'undo'} />
          </button>
        </div>
      )
    );
  }

  renderRelationship() {
    const { parentEntity, hub, search, editing, relationTypes, index } = this.props;
    const relationship = hub.get('leftRelationship');
    const targetReference = relationship.get('range') ? relationship : null;
    return (
      <div
        key="leftRelationshipType"
        className={`leftRelationshipType ${hub.get('deleted') ? 'deleted' : ''}`}
      >
        {!editing && hub.getIn(['leftRelationship', 'template']) && (
          <div className="rw-dropdown-list rw-widget">
            <div className="rw-widget-input rw-widget-picker rw-widget-container no-edit">
              <div className="rw-input rw-dropdown-list-input no-edit">
                {
                  relationTypes.find(r => r._id === hub.getIn(['leftRelationship', 'template']))
                    .name
                }
              </div>
            </div>
          </div>
        )}
        {editing && (
          <DropdownList
            valueField="_id"
            textField="name"
            data={relationTypes}
            value={hub.getIn(['leftRelationship', 'template'])}
            filter="contains"
            onChange={this.props.updateLeftRelationshipType.bind(null, index)}
          />
        )}
        <div
          className={`leftDocument ${
            !hub.getIn(['leftRelationship', 'template']) && !editing
              ? 'docWithoutRelationshipType'
              : ''
          }`}
        >
          <Doc
            className="item-collapsed"
            doc={parentEntity}
            searchParams={search}
            onClick={this.onClick}
            targetReference={targetReference}
          />
        </div>
        <HubRelationshipMetadata relationship={hub.get('leftRelationship')} />
      </div>
    );
  }

  render() {
    const { hub, index, parentEntity } = this.props;
    if (!parentEntity.get('sharedId')) {
      return false;
    }
    return (
      <>
        {this.renderTrashButton(hub, index)}
        {this.renderRelationship()}
        {LeftRelationship.renderFigure()}
      </>
    );
  }
}

LeftRelationship.propTypes = {
  index: PropTypes.number.isRequired,
  parentEntity: PropTypes.instanceOf(Map).isRequired,
  hub: PropTypes.instanceOf(Map).isRequired,
  editing: PropTypes.bool.isRequired,
  search: PropTypes.instanceOf(Object).isRequired,
  relationTypes: PropTypes.instanceOf(Array).isRequired,
  updateLeftRelationshipType: PropTypes.func.isRequired,
  toggelRemoveLeftRelationship: PropTypes.func.isRequired,
  selectConnection: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { relationships } = state;
  return {
    parentEntity: relationships.list.entity,
    search: relationships.list.sort,
    editing: relationships.hubActions.get('editing'),
    relationTypes: actions.selectRelationTypes(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      selectConnection: actions.selectConnection,
      updateLeftRelationshipType: actions.updateLeftRelationshipType,
      toggelRemoveLeftRelationship: actions.toggelRemoveLeftRelationship,
    },
    dispatch
  );
}

export { LeftRelationship, mapStateToProps };
export default connect(mapStateToProps, mapDispatchToProps)(LeftRelationship);
