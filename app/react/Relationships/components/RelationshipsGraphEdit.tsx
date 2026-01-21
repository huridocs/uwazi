import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import React, { Component } from 'react';

import Icon from '#UI/Icon/Icon.jsx';
import { Translate } from '#app/I18N/index.js';
import * as actions from '#app/Relationships/actions/actions.js';
import LeftRelationship from '#app/Relationships/components/LeftRelationship.js';
import RightRelationship from '#app/Relationships/components/RightRelationship.js';
import { ClientEntitySchema, IStore } from '#app/istore.js';

type RelationshipsGraphEditProps = {
  searchResults: [];
  parentEntity: ClientEntitySchema;
  editing: boolean;
  parseResults: (results: [], parentEntity: ClientEntitySchema, editing: boolean) => void;
  hubs: [];
  addHub: () => void;
};

export class RelationshipsGraphEdit extends Component<RelationshipsGraphEditProps> {
  componentDidMount() {
    this.props.parseResults(this.props.searchResults, this.props.parentEntity, this.props.editing);
  }

  componentDidUpdate(prevProps: RelationshipsGraphEdit['props']) {
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

export function mapStateToProps(state: IStore) {
  const { relationships } = state;
  return {
    parentEntity: relationships.list.entity,
    searchResults: relationships.list.searchResults,
    search: relationships.list.sort,
    hubs: relationships.hubs,
    editing: relationships.hubActions.get('editing'),
  };
}

function mapDispatchToProps(dispatch: Dispatch<{}>) {
  return bindActionCreators(
    {
      parseResults: actions.parseResults,
      addHub: actions.addHub,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsGraphEdit);
