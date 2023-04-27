/* eslint-disable react/button-has-type */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setTargetDocument } from 'app/Connections/actions/actions';
import SearchForm from 'app/Connections/components/SearchForm';
import SearchResults from 'app/Connections/components/SearchResults';
import { Icon } from 'app/UI';
import {
  deleteRelationships,
  getRelationshipsByEntity,
  saveRelationship,
} from '../actions/specs/V2NewRelationshipsActions';

class V2NewRelationshipsBoard extends Component {
  constructor(props, context) {
    super(props, context);
    this.relationships = [];
    this.newEntryType = this.props.relationTypes[0]._id;
  }

  async componentDidMount() {
    this.relationships = await getRelationshipsByEntity(this.props.sharedId);
    this.forceUpdate();
  }

  selectType(event) {
    this.newEntryType = event.target.value;
  }

  async saveRelationship() {
    const { sharedId, targetDocument } = this.props;
    await saveRelationship(this.newEntryType, sharedId, targetDocument);
  }

  render() {
    const { sharedId, searchResults, uiState, relationTypes, targetDocument } = this.props;
    return (
      <>
        <div>{sharedId}</div>
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
            {relationTypes.map(rt => (
              <option value={rt._id}>{rt.name}</option>
            ))}
          </select>
          <Icon icon="arrow-right" />
          <input
            type="text"
            id="newEntryTargetSelector"
            name="newEntryTargetSelector"
            value={targetDocument || 'select target entity'}
            disabled
          />
          <button disabled={!targetDocument} onClick={this.saveRelationship.bind(this)}>
            Save
          </button>
          <SearchForm />
          <SearchResults
            results={searchResults}
            searching={uiState.get('searching')}
            selected={targetDocument}
            onClick={this.props.setTargetDocument}
          />
        </div>
      </>
    );
  }
}

V2NewRelationshipsBoard.defaultProps = {};

V2NewRelationshipsBoard.propTypes = {
  sharedId: PropTypes.string.isRequired,
  relationTypes: PropTypes.array.isRequired,
  searchResults: PropTypes.object,
  uiState: PropTypes.object,
  setTargetDocument: PropTypes.func,
  targetDocument: PropTypes.string,
};

export function mapStateToProps(state) {
  return {
    relationTypes: state.relationTypes.toJS(),
    uiState: state.connections.uiState,
    searchResults: state.connections.searchResults,
    targetDocument: state.connections.connection.get('targetDocument'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ setTargetDocument }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(V2NewRelationshipsBoard);
