import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setTargetDocument } from 'app/Connections/actions/actions';
import SearchForm from 'app/Connections/components/SearchForm';
import SearchResults from 'app/Connections/components/SearchResults';
import { Icon } from 'app/UI';
import { sortByStrings } from 'shared/data_utils/objectSorting';
import {
  deleteRelationships,
  getRelationshipsByEntity,
  saveRelationship,
} from '../actions/V2NewRelationshipsActions';

const bg = i => (i % 2 === 0 ? '#f2f2f2' : '#ffffff');

class V2NewRelationshipsBoard extends Component {
  constructor(props, context) {
    super(props, context);
    this.relationships = [];
    this.newEntryType = this.props.relationTypes[0]._id;
    this.entityTitlesBySharedId = {};
  }

  async componentDidMount() {
    const relationships = await getRelationshipsByEntity(this.props.sharedId);

    const [fromThis, toThis] = _.partition(
      relationships,
      r => r.from.entity === this.props.sharedId
    );
    sortByStrings(fromThis, [
      r => r.from.entityTitle,
      r => r.relationshipTypeName,
      r => r.to.entityTitle,
    ]);
    sortByStrings(toThis, [
      r => r.from.entityTitle,
      r => r.relationshipTypeName,
      r => r.to.entityTitle,
    ]);
    this.relationships = [...fromThis, ...toThis];
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

  showReferenceText(relationship, i) {
    if (relationship.from.text || relationship.to.text) {
      return (
        <tr style={{ height: '100px', background: bg(i) }}>
          <td style={{ padding: '5px' }}>{relationship.from.text}</td>
          <td colSpan="5" style={{ padding: '5px' }}>
            {relationship.to.text}
          </td>
        </tr>
      );
    }
  }

  render() {
    const { searchResults, uiState, relationTypes, targetDocument } = this.props;

    return (
      <div className="v2_new_rel_board" no-translate>
        <div>Existing:</div>
        <div>
          <table style={{ width: '100%' }}>
            <tr>
              <th style={{ width: '30%' }}>From</th>
              <th />
              <th>Relationship Type</th>
              <th />
              <th style={{ width: '30%' }}>To</th>
              <th>Delete</th>
            </tr>
            {this.relationships.map((r, i) => (
              <>
                <tr style={{ height: '40px', background: bg(i) }}>
                  <td style={{ padding: '5px 8px' }}>
                    {r.from.entityTitle}
                    {` (${r.from.entityTemplateName})`}
                  </td>
                  <td>
                    <Icon icon="arrow-right" />
                  </td>
                  <td style={{ padding: '5px 8px' }}>{r.relationshipTypeName}</td>
                  <td>
                    <Icon icon="arrow-right" />
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    {r.to.entityTitle}
                    {` (${r.to.entityTemplateName})`}
                  </td>
                  <td>
                    <button type="button" onClick={this.deleteRelationship(r._id).bind(this)}>
                      X
                    </button>
                  </td>
                </tr>
                {this.showReferenceText(r, i)}
              </>
            ))}
          </table>
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
          <button
            type="button"
            disabled={!targetDocument}
            onClick={this.saveRelationship.bind(this)}
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
