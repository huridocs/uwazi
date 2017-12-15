/* TEST!!! Entire component */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as actions from '../actions/actions';
import * as uiActions from '../actions/uiActions';

import Doc from 'app/Library/components/Doc';

import DropdownList from 'app/Forms/components/DropdownList';

export class RelationshipsGraphEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      relationshipTypes: [{_id: null, name: 'Simple relationship'}].concat(props.relationTypes.toJS())
    };

    this.updateLeftRelationshipType = this.updateLeftRelationshipType.bind(this);
    this.updateRightRelationshipType = this.updateRightRelationshipType.bind(this);
    this.removeHub = this.removeHub.bind(this);
    this.removeRightRelationshipGroup = this.removeRightRelationshipGroup.bind(this);
    this.addEntities = this.addEntities.bind(this);
  }

  componentWillMount() {
    if (!this.props.hubs.size) {
      this.props.addHub();
    }
  }

  updateLeftRelationshipType(hubIndex) {
    return (value) => {
      this.props.updateLeftRelationshipType(hubIndex, value._id);
    };
  }

  updateRightRelationshipType(hubIndex, rightRelationshipIndex) {
    return (value) => {
      this.props.updateRightRelationshipType(hubIndex, rightRelationshipIndex, value._id);
    };
  }

  removeHub(hubIndex) {
    return () => {
      this.props.removeHub(hubIndex);
    };
  }

  removeRightRelationshipGroup(hubIndex, rightRelationshipIndex) {
    return () => {
      this.props.removeRightRelationshipGroup(hubIndex, rightRelationshipIndex);
    };
  }

  addEntities(hubIndex, rightRelationshipIndex) {
    return () => {
      this.props.edit(hubIndex, rightRelationshipIndex);
      this.props.openAddEntitiesPanel();
    };
  }

  removeEntity(hubIndex, rightRelationshipIndex, entityIndex) {
    return () => {
      this.props.removeEntity(hubIndex, rightRelationshipIndex, entityIndex);
    };
  }

  render() {
    const {parentEntity, hubs, search, addHub} = this.props;

    return (
      <div className="relationships-graph">

		<div className="relationshipsParent">
          <Doc doc={parentEntity} searchParams={search} />
        </div>

        <div>

          {hubs.map((hub, index) =>
            <div className="relationshipsHub" key={index}>
              <div className="removeHub">
                <i onClick={this.removeHub(index)}
			  	   className="relationships-removeIcon fa fa-times"></i>
              </div>
              <div className="leftRelationshipType">
                <DropdownList valueField="_id"
                              textField="name"
                              data={this.state.relationshipTypes}
                              value={hub.getIn(['leftRelationship', '_id'])}
                              filter="contains"
                              onChange={this.updateLeftRelationshipType(index)} />
              </div>
			  <div className="hubRelationship">
				  <figure></figure>
			  </div>
			  <div className="rightRelationships">
                {hub.get('rightRelationships').map((rightRelationship, rightRelationshipIndex) =>
                  <div className="rightRelationshipsTypeGroup" key={rightRelationshipIndex}>
                    <div className="rightRelationshipType">
                      <DropdownList valueField="_id"
                                    textField="name"
                                    data={this.state.relationshipTypes}
                                    value={rightRelationship.get('_id')}
                                    placeholder="New connection type"
                                    filter="contains"
                                    onChange={this.updateRightRelationshipType(index, rightRelationshipIndex)}/>
                    </div>
                    <div className="removeRightRelationshipGroup">
                      {(() => {
                        if (rightRelationship.has('_id')) {
                          return <i onClick={this.removeRightRelationshipGroup(index, rightRelationshipIndex)}
                                    className="relationships-removeIcon fa fa-times"></i>;
                        }

                        return <span>&nbsp;</span>;
                      })()}
                    </div>
                    {rightRelationship.get('entities').map((entity, entityIndex) =>
                      <div className="rightRelationship"  key={entityIndex}>
						<div className="rightRelationshipType">
                          <Doc doc={entity} searchParams={search} />
                        </div>
                        <div className="removeEntity">
                          <i onClick={this.removeEntity(index, rightRelationshipIndex, entityIndex)}
                             className="relationships-removeIcon fa fa-times"></i>
                        </div>
                      </div>
                    )}
                    {(() => {
                      if (rightRelationship.has('_id')) {
							return <div className="rightRelationshipAdd">
									<button className="relationships-new" 
                                            onClick={this.addEntities(index, rightRelationshipIndex)}>
                                        <span>Add entities / documents</span>
                                        <i className="fa fa-plus"></i>
                                    </button>
                               </div>;
                      }

                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="relationshipsHub">
            <div className="leftRelationshipType">
				<button className="relationships-new" onClick={addHub}>
                    <span>New relationships group</span>
                    <i className="fa fa-plus"></i>
				</button>
            </div>
          </div>



        </div>

      </div>
    );
  }
}

RelationshipsGraphEdit.propTypes = {
  parentEntity: PropTypes.object,
  hubs: PropTypes.object,
  search: PropTypes.object,
  relationTypes: PropTypes.object,
  addHub: PropTypes.func,
  updateLeftRelationshipType: PropTypes.func,
  updateRightRelationshipType: PropTypes.func,
  removeHub: PropTypes.func,
  removeRightRelationshipGroup: PropTypes.func,
  edit: PropTypes.func,
  removeEntity: PropTypes.func,
  openAddEntitiesPanel: PropTypes.func
};

export function mapStateToProps({entityView, connectionsList, relationships, relationTypes}) {
  return {
    parentEntity: entityView.entity,
    search: connectionsList.sort,
    hubs: relationships.hubs,
    relationTypes
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    addHub: actions.addHub,
    updateLeftRelationshipType: actions.updateLeftRelationshipType,
    updateRightRelationshipType: actions.updateRightRelationshipType,
    removeHub: actions.removeHub,
    removeRightRelationshipGroup: actions.removeRightRelationshipGroup,
    edit: actions.edit,
    removeEntity: actions.removeEntity,
    openAddEntitiesPanel: uiActions.openPanel
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsGraphEdit);
