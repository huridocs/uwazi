// TEST!!! Entire component
import api from 'app/utils/api';
import {actions} from 'app/BasicReducer';
import debounce from 'app/utils/debounce';
import {notify} from 'app/Notifications';
import {referencesActions} from 'app/Viewer';

import * as types from './actionTypes';
import * as uiActions from './uiActions';
import * as routeUtils from '../utils/routeUtils';


export function parseResults(results, parentEntity, editing) {
  return {type: types.PARSE_RELATIONSHIPS_RESULTS, results, parentEntity, editing};
}

export function edit(value, results, parentEntity) {
  return {type: types.EDIT_RELATIONSHIPS, value, results, parentEntity, editing: value};
}

export function addHub() {
  return {type: types.ADD_RELATIONSHIPS_HUB};
}

export function toggelRemoveLeftRelationship(index) {
  return {type: types.TOGGLE_REMOVE_RELATIONSHIPS_LEFT, index};
}

export function toggleRemoveRightRelationshipGroup(index, rightIndex) {
  return {type: types.TOGGLE_REMOVE_RELATIONSHIPS_RIGHT_GROUP, index, rightIndex};
}

export function updateLeftRelationshipType(index, _id) {
  return {type: types.UPDATE_RELATIONSHIPS_LEFT_TYPE, index, _id};
}

export function setAddToData(index, rightIndex) {
  return {type: types.SET_RELATIONSHIPS_ADD_TO_DATA, index, rightIndex};
}

export function updateRightRelationshipType(index, rightIndex, _id) {
  return function (dispatch, getState) {
    const hubs = getState().relationships.hubs;
    let newRightRelationshipType = rightIndex === hubs.getIn([index, 'rightRelationships']).size - 1;

    dispatch({type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE, index, rightIndex, _id, newRightRelationshipType});

    if (newRightRelationshipType) {
      dispatch(setAddToData(index, rightIndex));
      dispatch(uiActions.openPanel());
    }
  };
}

export function addEntity(index, rightIndex, entity) {
  return function (dispatch) {
    const title = entity.title.length > 75 ? entity.title.slice(0, 75) + '(...)' : entity.title;
    dispatch(notify(`${title} added to hub.  Save your work to make change permanent.`, 'success'));
    dispatch({type: types.ADD_RELATIONSHIPS_ENTITY, index, rightIndex, entity});
  };
}

export function toggleRemoveEntity(index, rightIndex, relationshipIndex) {
  return {type: types.TOGGLE_REMOVE_RELATIONSHIPS_ENTITY, index, rightIndex, relationshipIndex};
}

export function reloadRelationships(parentEntityId) {
  return function (dispatch, getState) {
    return routeUtils.requestState(parentEntityId, getState())
    .then(([connectionsGroups, searchResults]) => {
      dispatch(actions.set('relationships/list/connectionsGroups', connectionsGroups));
      dispatch(actions.set('relationships/list/searchResults', searchResults));
    });
  };
}

export function saveRelationships() {
  return function (dispatch, getState) {
    dispatch({type: types.SAVING_RELATIONSHIPS});
    const parentEntityId = getState().relationships.list.entityId;
    const hubs = getState().relationships.hubs.toJS();

    const apiCall = hubs.reduce((apiActions, hubData) => {
      if (!hubData.hub && !hubData.deleted) {
        const leftRelationship = Object.assign({entity: parentEntityId}, hubData.leftRelationship);
        const rightRelationships = hubData.rightRelationships.reduce((relationships, rightGroup) => {
          if (!rightGroup.deleted) {
            const newRelationships = rightGroup.relationships
            .filter(r => !r.deleted)
            .map(r => Object.assign(r, {entity: r.entity.sharedId}));

            return relationships.concat(newRelationships);
          }

          return relationships;
        }, []);
        const fullHubData = [leftRelationship].concat(rightRelationships);
        apiActions.save.push(fullHubData);
      }

      if (hubData.hub) {
        if (hubData.deleted) {
          apiActions.delete.push({_id: hubData.leftRelationship._id, entity: parentEntityId});
        }

        if (hubData.modified && !hubData.deleted) {
          apiActions.save.push(Object.assign({entity: parentEntityId, hub: hubData.hub}, hubData.leftRelationship));
        }

        hubData.rightRelationships.forEach(rightGroup => {
          rightGroup.relationships.forEach(r => {
            const deleted = rightGroup.deleted || r.deleted;

            if (deleted && r._id) {
              apiActions.delete.push(Object.assign({_id: r._id, entity: r.entity.sharedId}));
            }

            const toSave = rightGroup.modified || !r._id;

            if (toSave && !deleted) {
              apiActions.save.push(Object.assign(r, {entity: r.entity.sharedId, hub: hubData.hub}));
            }
          });
        });
      }

      return apiActions;
    }, {save: [], delete: []});

    return api.post('relationships/bulk', apiCall)
    .then((response) => {
      return Promise.all([
        response,
        api.get(`entities?_id=${parentEntityId}`).then(r => r.json.rows[0]),
        reloadRelationships(parentEntityId)(dispatch, getState)
      ]);
    })
    .then(([response, parentEntity]) => {
      dispatch(actions.set('entityView/entity', parentEntity));
      dispatch(actions.set('viewer/doc', parentEntity));

      dispatch(uiActions.closePanel());
      dispatch(edit(false, getState().relationships.list.searchResults, getState().relationships.list.entity));
      dispatch(referencesActions.loadReferences(parentEntityId));
      dispatch({type: types.SAVED_RELATIONSHIPS, response});
      dispatch(notify('Relationships saved', 'success'));
    });
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

export function selectConnection(connection) {
  return actions.set('relationships/connection', connection);
}

export function unselectConnection() {
  return actions.set('relationships/connection', {});
}
