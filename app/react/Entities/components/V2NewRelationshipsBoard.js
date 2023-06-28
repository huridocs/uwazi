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
} from '../actions/V2NewRelationshipsActions';

const objectIndex = _.memoize(_objectIndex);

class V2NewRelationshipsBoard extends Component {
  constructor(props, context) {
    super(props, context);
    this.relationships = [];
    this.newEntryType = this.props.relationTypes[0]._id;
    this.entityTitlesBySharedId = {};
  }

  async componentDidMount() {
    const { relationships, titleMap } = await getRelationshipsByEntity(this.props.sharedId);
    const [fromThis, toThis] = _.partition(
      relationships,
      r => r.from.entity === this.props.sharedId
    );
    fromThis.sort((a, b) => a.to.entity.localeCompare(b.to.entity));
    toThis.sort((a, b) => a.from.entity.localeCompare(b.from.entity));
    this.relationships = [...fromThis, ...toThis];
    this.entityTitlesBySharedId = titleMap;
    this.forceUpdate();
  }

  selectType(event) {
    this.newEntryType = event.target.value;
  }

  appendTargetTitleToMap() {
    const { targetDocument } = this.props;
    const searchResults = this.props.searchResults.toJS();
    const savedResult = searchResults.find(r => r.sharedId === targetDocument);
    this.entityTitlesBySharedId[targetDocument] = savedResult.title;
  }

  async saveRelationship() {
    const { sharedId, targetDocument } = this.props;
    const [saved] = await saveRelationship(this.newEntryType, sharedId, targetDocument);
    this.appendTargetTitleToMap();
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

  showEntityName(sharedId) {
    return sharedId in this.entityTitlesBySharedId
      ? this.entityTitlesBySharedId[sharedId]
      : sharedId;
  }

  showReferenceText(relationship) {
    if (relationship.from.text || relationship.to.text) {
      return (
        <tr>
          <td>{relationship.from.text}</td>
          <td></td>
          <td></td>
          <td></td>
          <td>{relationship.to.text}</td>
          <td></td>
        </tr>
      );
    }
  }

  render() {
    const { searchResults, uiState, relationTypes, targetDocument } = this.props;
    const relTypesById = objectIndex(
      relationTypes,
      rt => rt._id,
      rt => rt
    );
    return (
      <div className="v2_new_rel_board">
        <div no-translate>Existing:</div>
        <div>
          <table>
            <tr>
              <th>From</th>
              <th />
              <th>Relationship Type</th>
              <th />
              <th style={{ maxWidth: '30%' }}>To</th>
              <th>Delete</th>
            </tr>
            {this.relationships.map(r => (
              <>
                <tr>
                  <td>{this.showEntityName(r.from.entity)}</td>
                  <td>
                    <Icon icon="arrow-right" />
                  </td>
                  <td>{relTypesById[r.type].name}</td>
                  <td>
                    <Icon icon="arrow-right" />
                  </td>
                  <td>{this.showEntityName(r.to.entity)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={this.deleteRelationship(r._id).bind(this)}
                      no-translate
                    >
                      X
                    </button>
                  </td>
                </tr>
                {this.showReferenceText(r)}
              </>
            ))}
          </table>
        </div>
        <br />
        <div no-translate>Add new:</div>
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
          <button
            type="button"
            disabled={!targetDocument}
            onClick={this.saveRelationship.bind(this)}
            no-translate
          >
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
      </div>
    );
  }
}

V2NewRelationshipsBoard.defaultProps = {};

V2NewRelationshipsBoard.propTypes = {
  sharedId: PropTypes.string.isRequired,
  relationTypes: PropTypes.array.isRequired,
  searchResults: PropTypes.object.isRequired,
  uiState: PropTypes.object.isRequired,
  setTargetDocument: PropTypes.func.isRequired,
  targetDocument: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
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
export { mapStateToProps, mapDispatchToProps };
