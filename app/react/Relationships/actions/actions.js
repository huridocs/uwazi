// TEST!!! Entire component
import api from 'app/utils/api';
import {actions} from 'app/BasicReducer';
import debounce from 'app/utils/debounce';

import * as types from './actionTypes';
import * as uiActions from './uiActions';


export function addHub() {
  return {type: types.ADD_RELATIONSHIPS_HUB};
}

export function removeLeftRelationship(hub, index) {
  return {type: types.REMOVE_RELATIONSHIPS_LEFT, hub, index};
}

export function removeRightRelationshipGroup(hub, index, rightIndex) {
  return {type: types.REMOVE_RELATIONSHIPS_RIGHT_GROUP, hub, index, rightIndex};
}

export function updateLeftRelationshipType(hub, index, _id) {
  return {type: types.UPDATE_RELATIONSHIPS_LEFT_TYPE, hub, index, _id};
}

export function updateRightRelationshipType(hub, index, rightIndex, _id) {
  return {type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE, hub, index, rightIndex, _id};
}

export function edit(index, rightIndex) {
  return {type: types.EDIT_RELATIONSHIPS_GROUP, index, rightIndex};
}

export function addEntity(index, rightIndex, entity) {
  return {type: types.ADD_RELATIONSHIPS_ENTITY, index, rightIndex, entity};
}

export function removeEntity(hub, index, rightIndex, relationshipIndex) {
  return {type: types.REMOVE_RELATIONSHIPS_ENTITY, hub, index, rightIndex, relationshipIndex};
}

export function saveRelationships() {
  return function (dispatch, getState) {
    dispatch({type: types.SAVING_RELATIONSHIPS});
    const parentEntityId = getState().entityView.entity.get('sharedId');
    const hubs = getState().relationships.hubs.toJS();
    const hubActions = getState().relationships.hubActions.toJS();

    const apiCall = hubs.reduce((apiActions, hubData) => {
      if (!hubData.hub) {
        const leftRelationship = Object.assign({entity: parentEntityId}, hubData.leftRelationship);
        const rightRelationships = hubData.rightRelationships.reduce((relationships, rightGroup) => {
          return relationships.concat(rightGroup.relationships.map(r => Object.assign(r, {entity: r.entity._id})));
        }, []);
        const fullHubData = [leftRelationship].concat(rightRelationships);
        apiActions.save.push(fullHubData);
      }

      if (hubData.hub) {
        if (hubActions.changed.indexOf(hubData.leftRelationship._id) !== -1 && !hubData.deleted) {
          apiActions.save.push(Object.assign({entity: parentEntityId, hub: hubData.hub}, hubData.leftRelationship));
        }

        if (hubActions.deleted.indexOf(hubData.leftRelationship._id) !== -1) {
          apiActions.delete.push({_id: hubData.leftRelationship._id});
        }

        hubData.rightRelationships.forEach(rightGroup => {
          rightGroup.relationships.forEach(r => {
            if (hubActions.changed.indexOf(r._id) !== -1 && !rightGroup.deleted && !r.deleted) {
              apiActions.save.push(Object.assign(r, {entity: r.entity._id, hub: hubData.hub}));
            }

            if (hubActions.deleted.indexOf(r._id) !== -1) {
              apiActions.delete.push(Object.assign({_id: r._id}));
            }

            if (!r._id && !rightGroup.deleted) {
              apiActions.save.push(Object.assign(r, {entity: r.entity._id, hub: hubData.hub}));
            }
          });
        });
      }

      return apiActions;
    }, {save: [], delete: []});

    console.log('apiCall:', apiCall);
  };
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
