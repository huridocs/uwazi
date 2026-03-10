import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { Translate, t } from 'app/I18N';
import Doc from 'app/Library/components/Doc';
import DropdownList from 'react-widgets/lib/DropdownList';
import * as actions from '../actions/actions';
import * as uiActions from '../actions/uiActions';
import HubRelationshipMetadata from './HubRelationshipMetadata';

class RightRelationship extends Component {
  constructor(props) {
    super(props);
    this.updateRightRelationshipType = this.updateRightRelationshipType.bind(this);
    this.toggleRemoveRightRelationshipGroup = this.toggleRemoveRightRelationshipGroup.bind(this);
    this.toggleRemoveEntity = this.toggleRemoveEntity.bind(this);
    this.setAddToData = this.setAddToData.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onClick(_e, entity) {
    this.props.selectConnection(entity);
  }

  setAddToData(hubIndex, rightRelationshipIndex) {
    return () => {
      this.props.setAddToData(hubIndex, rightRelationshipIndex);
      this.props.openAddEntitiesPanel();
    };
  }

  updateRightRelationshipType(index, rightRelationshipIndex) {
    return value => {
      this.props.updateRightRelationshipType(index, rightRelationshipIndex, value._id);
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

  render() {
    const { hub, index, search, hubActions, relationTypes } = this.props;
    const editing = hubActions.get('editing');
    return (
      <div className="rightRelationships">
        {hub.get('rightRelationships').map((rightRelationshipGroup, rightRelationshipIndex) => (
          <div
            className={`rightRelationshipsTypeGroup ${
              rightRelationshipGroup.get('deleted') ? 'deleted' : ''
            }`}
            key={rightRelationshipIndex}
          >
            <div
              className={`rightRelationshipType
                             ${
                               rightRelationshipIndex === hub.get('rightRelationships').size - 1
                                 ? 'last-of-type'
                                 : ''
                             }`}
            >
              {!editing && (
                <div className="rw-dropdown-list rw-widget no-edit">
                  <div className="rw-widget-input rw-widget-picker rw-widget-container no-edit">
                    <div className="rw-input rw-dropdown-list-input no-edit">
                      {(() => {
                        if (
                          relationTypes.find(r => r._id === rightRelationshipGroup.get('template'))
                        ) {
                          return rightRelationshipGroup.get('template') ? (
                            relationTypes.find(
                              r => r._id === rightRelationshipGroup.get('template')
                            ).name
                          ) : (
                            <Icon icon="link" />
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {editing && (
                <DropdownList
                  valueField="_id"
                  textField="name"
                  data={relationTypes}
                  value={rightRelationshipGroup.get('template')}
                  placeholder={t('System', 'New relationship type', null, false)}
                  filter="contains"
                  onChange={this.updateRightRelationshipType(index, rightRelationshipIndex)}
                />
              )}
            </div>
            {editing && (
              <div className="removeRightRelationshipGroup">
                {(() => {
                  if (rightRelationshipGroup.has('template')) {
                    return (
                      <button
                        type="button"
                        onClick={this.toggleRemoveRightRelationshipGroup(
                          index,
                          rightRelationshipIndex
                        )}
                        className="relationships-icon"
                      >
                        <Icon
                          icon={!rightRelationshipGroup.get('deleted') ? 'trash-alt' : 'undo'}
                        />
                      </button>
                    );
                  }

                  return <span>&nbsp;</span>;
                })()}
              </div>
            )}
            {rightRelationshipGroup.get('relationships').map((relationship, relationshipIndex) => {
              if (relationship.get('moved')) {
                return false;
              }
              const rightRelationshipDeleted = rightRelationshipGroup.get('deleted');
              const deleted = relationship.get('deleted');
              const move = relationship.get('move');
              return (
                <div
                  className={`rightRelationship ${
                    !rightRelationshipDeleted && deleted ? 'deleted' : ''
                  } ${move ? 'move' : ''}`}
                  key={relationshipIndex}
                >
                  <div className="rightRelationshipType">
                    <Doc
                      className="item-collapsed"
                      doc={relationship.get('entityData')}
                      searchParams={search}
                      onClick={this.onClick}
                      targetReference={relationship.get('reference') ? relationship : null}
                    />
                    <HubRelationshipMetadata relationship={relationship} />
                  </div>
                  {editing && (
                    <div className="removeEntity">
                      <button
                        type="button"
                        onClick={this.toggleRemoveEntity(
                          index,
                          rightRelationshipIndex,
                          relationshipIndex
                        )}
                        className="relationships-icon"
                      >
                        <Icon icon={!deleted ? 'trash-alt' : 'undo'} />
                      </button>
                    </div>
                  )}
                  {editing && (
                    <div className="moveEntity">
                      <button
                        type="button"
                        onClick={this.props.toggleMoveEntity.bind(
                          this,
                          index,
                          rightRelationshipIndex,
                          relationshipIndex
                        )}
                        className={`relationships-icon ${!move ? '' : 'moving'}`}
                      >
                        <Icon icon="check" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              if (editing && rightRelationshipGroup.has('template')) {
                const isActive =
                  hubActions.getIn(['addTo', 'hubIndex']) === index &&
                  hubActions.getIn(['addTo', 'rightRelationshipIndex']) === rightRelationshipIndex;
                return (
                  <div className="rightRelationshipAdd">
                    <button
                      type="button"
                      className={`relationships-new ${isActive ? 'is-active' : ''}`}
                      onClick={this.setAddToData(index, rightRelationshipIndex)}
                    >
                      <span>
                        <Translate>Add entities / documents</Translate>
                      </span>
                      <Icon icon="plus" />
                    </button>
                    <div className="insertEntities">
                      <button
                        type="button"
                        onClick={this.props.moveEntities.bind(this, index, rightRelationshipIndex)}
                        className="relationships-icon"
                      >
                        <Icon icon="arrow-left" />
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        ))}
      </div>
    );
  }
}

RightRelationship.propTypes = {
  index: PropTypes.number.isRequired,
  hub: PropTypes.instanceOf(Object).isRequired,
  hubActions: PropTypes.instanceOf(Object).isRequired,
  search: PropTypes.instanceOf(Object).isRequired,
  relationTypes: PropTypes.instanceOf(Array).isRequired,
  updateRightRelationshipType: PropTypes.func.isRequired,
  toggleRemoveRightRelationshipGroup: PropTypes.func.isRequired,
  toggleMoveEntity: PropTypes.func.isRequired,
  setAddToData: PropTypes.func.isRequired,
  toggleRemoveEntity: PropTypes.func.isRequired,
  moveEntities: PropTypes.func.isRequired,
  openAddEntitiesPanel: PropTypes.func.isRequired,
  selectConnection: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { relationships } = state;
  return {
    search: relationships.list.sort,
    hubs: relationships.hubs,
    hubActions: relationships.hubActions,
    relationTypes: actions.selectRelationTypes(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      selectConnection: actions.selectConnection,
      updateRightRelationshipType: actions.updateRightRelationshipType,
      toggleRemoveRightRelationshipGroup: actions.toggleRemoveRightRelationshipGroup,
      setAddToData: actions.setAddToData,
      toggleRemoveEntity: actions.toggleRemoveEntity,
      moveEntities: actions.moveEntities,
      toggleMoveEntity: actions.toggleMoveEntity,
      openAddEntitiesPanel: uiActions.openPanel,
    },
    dispatch
  );
}

export { RightRelationship, mapStateToProps };
export default connect(mapStateToProps, mapDispatchToProps)(RightRelationship);
