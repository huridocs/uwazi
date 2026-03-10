import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Map, List } from 'immutable';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import * as actions from '../actions/actions';

import LeftRelationship from './LeftRelationship';
import RightRelationship from './RightRelationship';

export class RelationshipsGraphEdit extends Component {
  componentDidMount() {
    this.props.parseResults(this.props.searchResults, this.props.parentEntity, this.props.editing);
  }

  componentDidUpdate(prevProps) {
    if (this.props.searchResults !== prevProps.searchResults) {
      this.props.parseResults(
        this.props.searchResults,
        this.props.parentEntity,
        this.props.editing
      );
    }
  }

  render() {
    const { hubs, addHub } = this.props;

    return (
      <div className="relationships-graph">
        <div>
          {hubs.map((hub, index) => (
            <div className="relationshipsHub" key={index}>
              <LeftRelationship index={index} hub={hub} />
              <RightRelationship index={index} hub={hub} />
            </div>
          ))}

          {this.props.editing && (
            <div className="relationshipsHub">
              <div className="leftRelationshipType ">
                <button type="button" className="relationships-new" onClick={addHub}>
                  <span>
                    <Translate>New relationships group</Translate>
                  </span>
                  <Icon icon="plus" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

RelationshipsGraphEdit.propTypes = {
  parentEntity: PropTypes.instanceOf(Map).isRequired,
  hubs: PropTypes.instanceOf(List).isRequired,
  editing: PropTypes.bool.isRequired,
  searchResults: PropTypes.instanceOf(Map).isRequired,
  parseResults: PropTypes.func.isRequired,
  addHub: PropTypes.func.isRequired,
};

export function mapStateToProps(state) {
  const { relationships } = state;
  return {
    parentEntity: relationships.list.entity,
    searchResults: relationships.list.searchResults,
    search: relationships.list.sort,
    hubs: relationships.hubs,
    editing: relationships.hubActions.get('editing'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      parseResults: actions.parseResults,
      addHub: actions.addHub,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsGraphEdit);
