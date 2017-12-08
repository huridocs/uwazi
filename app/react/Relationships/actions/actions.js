import * as types from './actionTypes';

export function addHub() {
  return {
    type: types.ADD_RELATIONSHIPS_HUB
  };
}

export function removeHub(index) {
  return {
    type: types.REMOVE_RELATIONSHIPS_HUB,
    index
  };
}

export function removeRightRelationshipGroup(index, rightIndex) {
  return {
    type: types.REMOVE_RELATIONSHIPS_RIGHT_GROUP,
    index,
    rightIndex
  };
}

export function updateLeftRelationshipType(index, _id) {
  return {
    type: types.UPDATE_RELATIONSHIPS_LEFT_TYPE,
    index,
    _id
  };
}

export function updateRightRelationshipType(index, rightIndex, _id) {
  return {
    type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE,
    index,
    rightIndex,
    _id
  };
}
