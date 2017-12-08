import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = [];

const emptyRigthRelationship = () => {
  return {entities: []};
};

export default function (state = initialState, action = {}) {
  switch (action.type) {

  case types.ADD_RELATIONSHIPS_HUB:
    return state.push(fromJS({
      leftRelationship: {_id: null},
      rightRelationships: [emptyRigthRelationship()]
    }));

  case types.REMOVE_RELATIONSHIPS_HUB:
    console.log('En action delete:', action);
    return state.delete(action.index);

  case types.REMOVE_RELATIONSHIPS_RIGHT_GROUP:
    console.log('En action delete right:', action);
    return state.deleteIn([action.index, 'rightRelationships', action.rightIndex]);

  case types.UPDATE_RELATIONSHIPS_LEFT_TYPE:
    console.log('En action update left:', action);
    return state.setIn([action.index, 'leftRelationship', '_id'], action._id);

  case types.UPDATE_RELATIONSHIPS_RIGHT_TYPE:
    console.log('En action update right:', action);
    let updatedHubs = state.setIn([action.index, 'rightRelationships', action.rightIndex, '_id'], action._id);

    if (action.rightIndex === state.getIn([action.index, 'rightRelationships']).size - 1) {
      const updatedRightRelationships = updatedHubs.getIn([action.index, 'rightRelationships']).push(fromJS(emptyRigthRelationship()));
      updatedHubs = updatedHubs.setIn([action.index, 'rightRelationships'], updatedRightRelationships);
    }

    return updatedHubs;

  case types.ADD_RELATIONSHIPS_ENTITY:
    console.log('En add:', action);
    return state;

  default:
    return fromJS(state);
  }
}
