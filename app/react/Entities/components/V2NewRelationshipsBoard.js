/* eslint-disable react/button-has-type */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Icon } from 'UI';
import { getRelationshipsByEntity } from '../actions/specs/V2NewRelationshipsActions';

class V2NewRelationshipsBoard extends Component {
  constructor(props, context) {
    super(props, context);
    this.relationships = [];
    this.newEntryType = this.props.relationTypes[0]._id;
    this.newEntryTarget = undefined;
  }

  componentDidMount() {
    this.relationships = getRelationshipsByEntity(this.props.sharedId);
  }

  selectType(event) {
    this.newEntryType = event.target.value;
  }

  render() {
    return (
      <>
        <div>{this.props.sharedId}</div>
        <div>Existing:</div>
        <div>{JSON.stringify(this.relationships)}</div>
        <br />
        <div>Add new:</div>
        <div>
          <select
            name="newEntryTypeSelector"
            id="newEntryTypeSelector"
            onChange={this.selectType.bind(this)}
          >
            {this.props.relationTypes.map(rt => (
              <option value={rt._id}>{rt.name}</option>
            ))}
          </select>
          <Icon icon="arrow-right" />
          <input
            type="text"
            id="newEntryTargetSelector"
            name="newEntryTargetSelector"
            value={this.newEntryTarget ? this.newEntryTarget : 'select target entity'}
            disabled
          />
          <button disabled={this.newEntryTarget}>Save</button>
        </div>
      </>
    );
  }
}

V2NewRelationshipsBoard.defaultProps = {};

V2NewRelationshipsBoard.propTypes = {
  sharedId: PropTypes.string.isRequired,
  relationTypes: PropTypes.object.isRequired,
};

export function mapStateToProps(state) {
  return {
    relationTypes: state.relationTypes.toJS(),
  };
}

export default connect(mapStateToProps)(V2NewRelationshipsBoard);
