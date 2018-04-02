/* TEST!!! Entire component */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Doc from 'app/Library/components/Doc';
import DropdownList from 'app/Forms/components/DropdownList';

import * as actions from '../actions/actions';
import * as uiActions from '../actions/uiActions';

import HubRelationshipMetadata from './HubRelationshipMetadata';

export class RelationshipsGraphEdit extends Component {
  constructor(props) {
    super(props);

    this.updateLeftRelationshipType = this.updateLeftRelationshipType.bind(this);
    this.updateRightRelationshipType = this.updateRightRelationshipType.bind(this);
    this.toggelRemoveLeftRelationship = this.toggelRemoveLeftRelationship.bind(this);
    this.toggleRemoveRightRelationshipGroup = this.toggleRemoveRightRelationshipGroup.bind(this);
    this.setAddToData = this.setAddToData.bind(this);
    this.editingSelector = this.editingSelector.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  componentWillMount() {
    this.props.parseResults(this.props.searchResults, this.props.parentEntity, this.props.hubActions.get('editing'));
  }

  componentWillUpdate(nextProps) {
    if (this.props.searchResults !== nextProps.searchResults) {
      this.props.parseResults(nextProps.searchResults, nextProps.parentEntity, this.props.hubActions.get('editing'));
    }
  }

  onClick(e, entity) {
    this.props.selectConnection(entity);
  }

  setAddToData(hubIndex, rightRelationshipIndex) {
    return () => {
      this.props.setAddToData(hubIndex, rightRelationshipIndex);
      this.props.openAddEntitiesPanel();
    };
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

  toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex) {
    return () => {
      this.props.toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex);
    };
  }

  editingSelector(defaultElement, editingElement) {
    if (this.props.hubActions.get('editing')) {
      return editingElement;
    }
    return defaultElement;
  }

  render() {
    const { parentEntity, hubs, search, addHub, hubActions, relationTypes } = this.props;
    const editing = hubActions.get('editing');

    return (
      <div className="relationships-graph">

        <div>
          {hubs.map((hub, index) => (
            <div className="relationshipsHub" key={index} >
              {this.editingSelector(
                  null,
                <div className="removeHub">
                  <i
                    onClick={this.toggelRemoveLeftRelationship(index)}
                    className={`relationships-removeIcon fa ${!hub.get('deleted') ? 'fa-trash' : 'fa-undo'}`}
                  />
                </div>
              )}
              <div className={`leftRelationshipType ${hub.get('deleted') ? 'deleted' : ''}`}>
                {this.editingSelector(
                  (hub.getIn(['leftRelationship', 'template']) && (
                    <div className="rw-dropdown-list rw-widget">
                      <div className="rw-widget-input rw-widget-picker rw-widget-container no-edit">
                        <div className="rw-input rw-dropdown-list-input no-edit">
                          {relationTypes.find(r => r._id === hub.getIn(['leftRelationship', 'template'])).name}
                        </div>
                      </div>
                    </div>
                  )),
                  <DropdownList
                    valueField="_id"
                    textField="name"
                    data={relationTypes}
                    value={hub.getIn(['leftRelationship', 'template'])}
                    filter="contains"
                    onChange={this.updateLeftRelationshipType(index)}
                  />
                  )}
                <div className={`leftDocument ${!hub.getIn(['leftRelationship', 'template']) && !editing ?
                                'docWithoutRelationshipType' : ''}`}
                >
                  <Doc
                    className="item-collapsed"
                    doc={parentEntity}
                    searchParams={search}
                    onClick={this.onClick}
                  />
                </div>
                <HubRelationshipMetadata relationship={hub.get('leftRelationship')} />
              </div>
              <div className="hubRelationship">
                <figure />
              </div>
              <div className="rightRelationships">
                {hub.get('rightRelationships').map((rightRelationship, rightRelationshipIndex) => (
                  <div
                    className={`rightRelationshipsTypeGroup ${rightRelationship.get('deleted') ? 'deleted' : ''}`}
                    key={rightRelationshipIndex}
                  >
                    <div className={`rightRelationshipType
                                     ${rightRelationshipIndex === hub.get('rightRelationships').size - 1 ? 'last-of-type' : ''}`}
                    >
                      {this.editingSelector(
                        <div className="rw-dropdown-list rw-widget">
                          <div className="rw-widget-input rw-widget-picker rw-widget-container no-edit">
                            <div className="rw-input rw-dropdown-list-input no-edit">
                              {(() => {
                               if (relationTypes.find(r => r._id === rightRelationship.get('template'))) {
                                 return rightRelationship.get('template') ?
                                   relationTypes.find(r => r._id === rightRelationship.get('template')).name :
                                   <i className="fa fa-link" />;
                               }
                               return null;
                             })()}
                            </div>
                          </div>
                        </div>,
                        <DropdownList
                          valueField="_id"
                          textField="name"
                          data={relationTypes}
                          value={rightRelationship.get('template')}
                          placeholder="New connection type"
                          filter="contains"
                          onChange={this.updateRightRelationshipType(index, rightRelationshipIndex)}
                        />
                      )}
                    </div>
                    {this.editingSelector(null,
                      <div className="removeRightRelationshipGroup">
                        {(() => {
                          if (rightRelationship.has('template')) {
                            return (<i
                              onClick={this.toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex)}
                              className={`relationships-removeIcon fa
                                                  ${!rightRelationship.get('deleted') ? 'fa-trash' : 'fa-undo'}`}
                            />);
                          }

                          return <span>&nbsp;</span>;
                        })()}
                      </div>
                    )}
                    {rightRelationship.get('relationships').map((relationship, relationshipIndex) => (
                      <div
                        className={`rightRelationship ${!rightRelationship.get('deleted') && relationship.get('deleted') ? 'deleted' : ''}`}
                        key={relationshipIndex}
                      >
                        <div className="rightRelationshipType">
                          <Doc
                            className="item-collapsed"
                            doc={relationship.get('entity')}
                            searchParams={search}
                            onClick={this.onClick}
                          />
                          <HubRelationshipMetadata relationship={relationship} />
                        </div>
                        {this.editingSelector(null,
                          <div className="removeEntity">
                            <i
                              onClick={this.toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex)}
                              className={`relationships-removeIcon fa ${!relationship.get('deleted') ? 'fa-trash' : 'fa-undo'}`}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {(() => {
                      if (editing && rightRelationship.has('template')) {
                        const isActive = hubActions.getIn(['addTo', 'hubIndex']) === index &&
                                         hubActions.getIn(['addTo', 'rightRelationshipIndex']) === rightRelationshipIndex;
                        return (
                          <div className="rightRelationshipAdd">
                            <button
                              className={`relationships-new ${isActive ? 'is-active' : ''}`}
                              onClick={this.setAddToData(index, rightRelationshipIndex)}
                            >
                              <span>Add entities / documents</span>
                              <i className="fa fa-plus" />
                            </button>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>)
                )}
              </div>
            </div>
          ))}

          {this.editingSelector(null,
            <div className="relationshipsHub">
              <div className="leftRelationshipType ">
                <button className="relationships-new" onClick={addHub}>
                  <span>New relationships group</span>
                  <i className="fa fa-plus" />
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
  parentEntity: PropTypes.object,
  hubs: PropTypes.object,
  hubActions: PropTypes.object,
  searchResults: PropTypes.object,
  search: PropTypes.object,
  relationTypes: PropTypes.array,
  parseResults: PropTypes.func,
  addHub: PropTypes.func,
  updateLeftRelationshipType: PropTypes.func,
  updateRightRelationshipType: PropTypes.func,
  toggelRemoveLeftRelationship: PropTypes.func,
  toggleRemoveRightRelationshipGroup: PropTypes.func,
  setAddToData: PropTypes.func,
  toggleRemoveEntity: PropTypes.func,
  openAddEntitiesPanel: PropTypes.func,
  selectConnection: PropTypes.func
};

const selectRelationTypes = createSelector(
  state => state.relationTypes,
  relationTypes => [{ _id: null, name: 'No label' }].concat(relationTypes.toJS())
);

export function mapStateToProps(state) {
  const { relationships } = state;
  return {
    parentEntity: relationships.list.entity,
    searchResults: relationships.list.searchResults,
    search: relationships.list.sort,
    hubs: relationships.hubs,
    hubActions: relationships.hubActions,
    relationTypes: selectRelationTypes(state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    parseResults: actions.parseResults,
    addHub: actions.addHub,
    updateLeftRelationshipType: actions.updateLeftRelationshipType,
    selectConnection: actions.selectConnection,
    updateRightRelationshipType: actions.updateRightRelationshipType,
    toggelRemoveLeftRelationship: actions.toggelRemoveLeftRelationship,
    toggleRemoveRightRelationshipGroup: actions.toggleRemoveRightRelationshipGroup,
    setAddToData: actions.setAddToData,
    toggleRemoveEntity: actions.toggleRemoveEntity,
    openAddEntitiesPanel: uiActions.openPanel
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsGraphEdit);
