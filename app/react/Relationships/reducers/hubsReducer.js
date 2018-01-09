import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';
// TEMP FIXTURES!
import tempFixtures from '../components/tempFixtures';

// const initialState = [];
const initialState = fromJS(tempFixtures);

const emptyRigthRelationship = () => {
  return {relationships: []};
};

export default function (state = initialState, action = {}) {
  let relationships;

  switch (action.type) {

  case types.ADD_RELATIONSHIPS_HUB:
    return state.push(fromJS({
      leftRelationship: {template: null},
      rightRelationships: [emptyRigthRelationship()]
    }));

  case types.REMOVE_RELATIONSHIPS_LEFT:
    console.log('En hub action delete:', action);
    return state.delete(action.index);

  case types.REMOVE_RELATIONSHIPS_RIGHT_GROUP:
    console.log('En action delete right:', action);
    return state.deleteIn([action.index, 'rightRelationships', action.rightIndex]);

  case types.UPDATE_RELATIONSHIPS_LEFT_TYPE:
    console.log('En action update left:', action);
    return state.setIn([action.index, 'leftRelationship', 'template'], action._id);

  case types.UPDATE_RELATIONSHIPS_RIGHT_TYPE:
    console.log('En action update right:', action);
    let updatedHubs = state.setIn([action.index, 'rightRelationships', action.rightIndex, 'template'], action._id);

    relationships = state
    .getIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'])
    .map(relationship => relationship.set('template', action._id));

    updatedHubs = updatedHubs.setIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'], relationships);

    if (action.rightIndex === state.getIn([action.index, 'rightRelationships']).size - 1) {
      const updatedRightRelationships = updatedHubs.getIn([action.index, 'rightRelationships']).push(fromJS(emptyRigthRelationship()));
      updatedHubs = updatedHubs.setIn([action.index, 'rightRelationships'], updatedRightRelationships);
    }

    return updatedHubs;

  case types.ADD_RELATIONSHIPS_ENTITY:
    console.log('En add:', action);
    const relationship = state.getIn([action.index, 'rightRelationships', action.rightIndex]);
    relationships = relationship.get('relationships').push(fromJS({template: relationship.get('template'), entity: action.entity}));

    return state.setIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'], relationships);

  case types.REMOVE_RELATIONSHIPS_ENTITY:
    console.log('En remove:', action);
    return state.deleteIn([action.index, 'rightRelationships', action.rightIndex, 'relationships', action.relationshipIndex]);

  default:
    return fromJS(state);
  }
}
