/* eslint-disable react/button-has-type */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setTargetDocument } from 'app/Connections/actions/actions';
import SearchForm from 'app/Connections/components/SearchForm';
import SearchResults from 'app/Connections/components/SearchResults';
import { Icon } from 'app/UI';
import { objectIndex as _objectIndex } from 'shared/data_utils/objectIndex';
import {
  deleteRelationships,
  getRelationshipsByEntity,
  saveRelationship,
} from '../actions/specs/V2NewRelationshipsActions';

const objectIndex = _.memoize(_objectIndex);

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
    const [saved] = await saveRelationship(this.newEntryType, sharedId, targetDocument);
    this.relationships.push(saved);
    this.forceUpdate();
  }

  deleteRelationship(id) {
    return async () => {
      await deleteRelationships([id]);
      this.relationships = this.relationships.filter(r => r._id !== id);
      this.forceUpdate();
    };
  }

  render() {
    const { sharedId, searchResults, uiState, relationTypes, targetDocument } = this.props;
    const relTypesById = objectIndex(
      relationTypes,
      rt => rt._id,
      rt => rt
    );
    return (
      <>
        <div>{sharedId}</div>
        <div>Existing:</div>
        <div>
          {this.relationships.map(r => (
            <div>
              {relTypesById[r.type].name}&emsp;
              <Icon icon="arrow-right" />
              &emsp;{r.to.entity}&emsp;
              <button onClick={this.deleteRelationship(r._id).bind(this)}>X</button>
            </div>
          ))}
        </div>
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
          &emsp;
          <Icon icon="arrow-right" />
          &emsp;
          <input
            type="text"
            id="newEntryTargetSelector"
            name="newEntryTargetSelector"
            value={targetDocument || 'select target entity'}
            disabled
          />
          &emsp;
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
