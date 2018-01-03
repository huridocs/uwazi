// TEST!!! Entire component
import api from 'app/utils/api';
import {actions} from 'app/BasicReducer';
import debounce from 'app/utils/debounce';

import * as types from './actionTypes';
import * as uiActions from './uiActions';


export function addHub() {
  return {type: types.ADD_RELATIONSHIPS_HUB};
}

export function removeHub(index) {
  return {type: types.REMOVE_RELATIONSHIPS_HUB, index};
}

export function removeRightRelationshipGroup(index, rightIndex) {
  return {type: types.REMOVE_RELATIONSHIPS_RIGHT_GROUP, index, rightIndex};
}

export function updateLeftRelationshipType(index, _id) {
  return {type: types.UPDATE_RELATIONSHIPS_LEFT_TYPE, index, _id};
}

export function updateRightRelationshipType(index, rightIndex, _id) {
  return {type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE, index, rightIndex, _id};
}

export function edit(index, rightIndex) {
  return {type: types.EDIT_RELATIONSHIPS_GROUP, index, rightIndex};
}

export function addEntity(index, rightIndex, entity) {
  return {type: types.ADD_RELATIONSHIPS_ENTITY, index, rightIndex, entity};
}

export function removeEntity(index, rightIndex, entityIndex) {
  return {type: types.REMOVE_RELATIONSHIPS_ENTITY, index, rightIndex, entityIndex};
}


export function immidiateSearch(dispatch, searchTerm) {
  dispatch(uiActions.searching());

  let query = {searchTerm, fields: ['title']};

  return api.get('search', query)
  .then((response) => {
    let results = response.json.rows;
    dispatch(actions.set('relationships/searchResults', results));
  });
}

const debouncedSearch = debounce(immidiateSearch, 400);

export function search(searchTerm) {
  return function (dispatch) {
    dispatch(actions.set('relationships/searchTerm', searchTerm));
    return debouncedSearch(dispatch, searchTerm);
  };
}
