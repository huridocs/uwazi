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
    this.toggelRemoveLeftRelationship = this.toggelRemoveLeftRelationship.bind(this);
    this.toggleRemoveRightRelationshipGroup = this.toggleRemoveRightRelationshipGroup.bind(this);
    this.setAddToData = this.setAddToData.bind(this);
    this.editingSelector = this.editingSelector.bind(this);
  }

  componentWillMount() {
    this.props.parseResults(this.props.searchResults, this.props.parentEntity, this.props.hubActions.get('editing'));
  }

  componentWillUpdate(nextProps) {
    if (this.props.searchResults !== nextProps.searchResults) {
      this.props.parseResults(nextProps.searchResults, nextProps.parentEntity, this.props.hubActions.get('editing'));
    }
  }

  updateLeftRelationshipType(index) {
    return (value) => {
      this.props.updateLeftRelationshipType(index, value._id);
    };
  }

  updateRightRelationshipType(index, rightRelationshipIndex) {
    return (value) => {
      this.props.updateRightRelationshipType(index, rightRelationshipIndex, value._id);
    };
  }

  toggelRemoveLeftRelationship(index) {
    return () => {
      this.props.toggelRemoveLeftRelationship(index);
    };
  }

  toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex) {
    return () => {
      this.props.toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex);
    };
  }

  setAddToData(hubIndex, rightRelationshipIndex) {
    return () => {
      this.props.setAddToData(hubIndex, rightRelationshipIndex);
      this.props.openAddEntitiesPanel();
    };
  }

  toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex) {
    return () => {
      this.props.toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex);
    };
  }

  saveRelationships() {
    console.log({hubs: this.props.hubs.toJS(), hubActions: this.props.hubActions.toJS()});
    this.props.save();
  }

  editingSelector(defaultElement, editingElement) {
    console.log('EDITING:', this.props.hubActions.get('editing'));
    if (this.props.hubActions.get('editing')) {
      return editingElement;
    }
    return defaultElement;
  }

  render() {
    const {parentEntity, hubs, search, addHub, hubActions} = this.props;
    const editing = hubActions.get('editing');

    return (
      <div className="relationships-graph">

        <div className="relationshipsParent">
          <Doc doc={parentEntity} searchParams={search} />
        </div>

        <div>
          {hubs.map((hub, index) =>
            <div className="relationshipsHub" key={index}>
              {this.editingSelector(null,
                <div className="removeHub">
                  <i onClick={this.toggelRemoveLeftRelationship(index)}
                     className={`relationships-removeIcon fa ${!hub.get('deleted') ? 'fa-trash' : 'fa-undo'}`}></i>
                </div>)}
              <div className={`leftRelationshipType ${hub.get('deleted') ? 'deleted' : ''}`}>
                {this.editingSelector(
                  <div className="rw-dropdown-list rw-widget">
                    <div className="rw-widget-input rw-widget-picker rw-widget-container no-edit">
                      <div className="rw-input rw-dropdown-list-input no-edit">
                        {this.state.relationshipTypes.find(r => r._id === hub.getIn(['leftRelationship', 'template'])).name}
                      </div>
                    </div>
                  </div>,
                  <DropdownList valueField="_id"
                                textField="name"
                                data={this.state.relationshipTypes}
                                value={hub.getIn(['leftRelationship', 'template'])}
                                filter="contains"
                                onChange={this.updateLeftRelationshipType(index)} />
                )}
              </div>
              <div className="hubRelationship">
                <figure></figure>
              </div>
              <div className="rightRelationships">
                {hub.get('rightRelationships').map((rightRelationship, rightRelationshipIndex) =>
                  <div className={`rightRelationshipsTypeGroup ${rightRelationship.get('deleted') ? 'deleted' : ''}`}
                       key={rightRelationshipIndex}>
                    <div className={`rightRelationshipType
                                     ${rightRelationshipIndex === hub.get('rightRelationships').size - 1 ? 'last-of-type' : ''}`}>
                      {this.editingSelector(
                        <div className="rw-dropdown-list rw-widget">
                          <div className="rw-widget-input rw-widget-picker rw-widget-container no-edit">
                            <div className="rw-input rw-dropdown-list-input no-edit">
                              {this.state.relationshipTypes.find(r => r._id === rightRelationship.get('template')) ?
                               this.state.relationshipTypes.find(r => r._id === rightRelationship.get('template')).name : null}
                            </div>
                          </div>
                        </div>,
                        <DropdownList valueField="_id"
                                      textField="name"
                                      data={this.state.relationshipTypes}
                                      value={rightRelationship.get('template')}
                                      placeholder="New connection type"
                                      filter="contains"
                                      onChange={this.updateRightRelationshipType(index, rightRelationshipIndex)}/>
                      )}
                    </div>
                    {this.editingSelector(null,
                      <div className="removeRightRelationshipGroup">
                        {(() => {
                          if (rightRelationship.has('template')) {
                            return <i onClick={this.toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex)}
                                      className={`relationships-removeIcon fa ${!rightRelationship.get('deleted') ? 'fa-trash' : 'fa-undo'}`}></i>;
                          }

                          return <span>&nbsp;</span>;
                        })()}
                      </div>
                    )}
                    {rightRelationship.get('relationships').map((relationship, relationshipIndex) =>
                      <div className={`rightRelationship ${!rightRelationship.get('deleted') && relationship.get('deleted') ? 'deleted' : ''}`}
                           key={relationshipIndex}>
                        <div className="rightRelationshipType">
                          <Doc doc={relationship.get('entity')} searchParams={search} />
                        </div>
                        {this.editingSelector(null,
                          <div className="removeEntity">
                            <i onClick={this.toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex)}
                               className={`relationships-removeIcon fa ${!relationship.get('deleted') ? 'fa-trash' : 'fa-undo'}`}></i>
                          </div>
                        )}
                      </div>
                    )}
                    {(() => {
                      if (editing && rightRelationship.has('template')) {
                        const isActive = hubActions.getIn(['addTo', 'hubIndex']) === index &&
                                         hubActions.getIn(['addTo', 'rightRelationshipIndex']) === rightRelationshipIndex;
                        return <div className="rightRelationshipAdd">
                                <button className={`relationships-new ${isActive ? 'is-active' : ''}`}
                                        onClick={this.setAddToData(index, rightRelationshipIndex)}>
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

          {this.editingSelector(null,
            <div className="relationshipsHub">
              <div className="leftRelationshipType ">
                <button className="relationships-new" onClick={addHub}>
                  <span>New relationships group</span>
                  <i className="fa fa-plus"></i>
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="leftRelationshipType">
              <button className="relationships-new btn btn-success" onClick={() => {this.saveRelationships();}}>
                Save Relationships
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
  hubActions: PropTypes.object,
  searchResults: PropTypes.object,
  search: PropTypes.object,
  relationTypes: PropTypes.object,
  parseResults: PropTypes.func,
  addHub: PropTypes.func,
  updateLeftRelationshipType: PropTypes.func,
  updateRightRelationshipType: PropTypes.func,
  toggelRemoveLeftRelationship: PropTypes.func,
  toggleRemoveRightRelationshipGroup: PropTypes.func,
  setAddToData: PropTypes.func,
  save: PropTypes.func,
  toggleRemoveEntity: PropTypes.func,
  openAddEntitiesPanel: PropTypes.func
};

export function mapStateToProps({entityView, connectionsList, relationships, relationTypes}) {
  return {
    parentEntity: entityView.entity,
    searchResults: connectionsList.searchResults,
    search: connectionsList.sort,
    hubs: relationships.hubs,
    hubActions: relationships.hubActions,
    relationTypes
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    parseResults: actions.parseResults,
    addHub: actions.addHub,
    updateLeftRelationshipType: actions.updateLeftRelationshipType,
    updateRightRelationshipType: actions.updateRightRelationshipType,
    toggelRemoveLeftRelationship: actions.toggelRemoveLeftRelationship,
    toggleRemoveRightRelationshipGroup: actions.toggleRemoveRightRelationshipGroup,
    setAddToData: actions.setAddToData,
    save: actions.saveRelationships,
    toggleRemoveEntity: actions.toggleRemoveEntity,
    openAddEntitiesPanel: uiActions.openPanel
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsGraphEdit);
