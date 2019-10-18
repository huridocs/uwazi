"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.parseResults = parseResults;exports.edit = edit;exports.addHub = addHub;exports.toggelRemoveLeftRelationship = toggelRemoveLeftRelationship;exports.toggleRemoveRightRelationshipGroup = toggleRemoveRightRelationshipGroup;exports.updateLeftRelationshipType = updateLeftRelationshipType;exports.setAddToData = setAddToData;exports.updateRightRelationshipType = updateRightRelationshipType;exports.addEntity = addEntity;exports.toggleRemoveEntity = toggleRemoveEntity;exports.toggleMoveEntity = toggleMoveEntity;exports.moveEntities = moveEntities;exports.reloadRelationships = reloadRelationships;exports.saveRelationships = saveRelationships;exports.immidiateSearch = immidiateSearch;exports.search = search;exports.selectConnection = selectConnection;exports.unselectConnection = unselectConnection;var _api = _interopRequireDefault(require("../../utils/api"));
var _BasicReducer = require("../../BasicReducer");
var _debounce = _interopRequireDefault(require("../../utils/debounce"));
var _Notifications = require("../../Notifications");
var _Viewer = require("../../Viewer");
var _RequestParams = require("../../utils/RequestParams");

var types = _interopRequireWildcard(require("./actionTypes"));
var uiActions = _interopRequireWildcard(require("./uiActions"));
var routeUtils = _interopRequireWildcard(require("../utils/routeUtils"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


function parseResults(results, parentEntity, editing) {
  return { type: types.PARSE_RELATIONSHIPS_RESULTS, results, parentEntity, editing };
}

function edit(value, results, parentEntity) {
  return { type: types.EDIT_RELATIONSHIPS, value, results, parentEntity, editing: value };
}

function addHub() {
  return { type: types.ADD_RELATIONSHIPS_HUB };
}

function toggelRemoveLeftRelationship(index) {
  return { type: types.TOGGLE_REMOVE_RELATIONSHIPS_LEFT, index };
}

function toggleRemoveRightRelationshipGroup(index, rightIndex) {
  return { type: types.TOGGLE_REMOVE_RELATIONSHIPS_RIGHT_GROUP, index, rightIndex };
}

function updateLeftRelationshipType(index, _id) {
  return { type: types.UPDATE_RELATIONSHIPS_LEFT_TYPE, index, _id };
}

function setAddToData(index, rightIndex) {
  return { type: types.SET_RELATIONSHIPS_ADD_TO_DATA, index, rightIndex };
}

function updateRightRelationshipType(index, rightIndex, _id) {
  return (dispatch, getState) => {
    const { hubs } = getState().relationships;
    const newRightRelationshipType = rightIndex === hubs.getIn([index, 'rightRelationships']).size - 1;

    dispatch({ type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE, index, rightIndex, _id, newRightRelationshipType });

    if (newRightRelationshipType) {
      dispatch(setAddToData(index, rightIndex));
      dispatch(uiActions.openPanel());
    }
  };
}

function addEntity(index, rightIndex, entity) {
  return dispatch => {
    const title = entity.title.length > 75 ? `${entity.title.slice(0, 75)}(...)` : entity.title;
    dispatch(_Notifications.notificationActions.notify(`${title} added to hub.  Save your work to make change permanent.`, 'success'));
    dispatch({ type: types.ADD_RELATIONSHIPS_ENTITY, index, rightIndex, entity });
  };
}

function toggleRemoveEntity(index, rightIndex, relationshipIndex) {
  return { type: types.TOGGLE_REMOVE_RELATIONSHIPS_ENTITY, index, rightIndex, relationshipIndex };
}

function toggleMoveEntity(index, rightIndex, relationshipIndex) {
  return { type: types.TOGGLE_MOVE_RELATIONSHIPS_ENTITY, index, rightIndex, relationshipIndex };
}

function moveEntities(index, rightRelationshipIndex) {
  return { type: types.MOVE_RELATIONSHIPS_ENTITY, index, rightRelationshipIndex };
}

function reloadRelationships(sharedId) {
  return (dispatch, getState) => routeUtils.requestState(new _RequestParams.RequestParams({ sharedId }), getState()).
  then(([connectionsGroups, searchResults]) => {
    dispatch(_BasicReducer.actions.set('relationships/list/connectionsGroups', connectionsGroups));
    dispatch(_BasicReducer.actions.set('relationships/list/searchResults', searchResults));
  });
}

function saveRelationships() {
  return (dispatch, getState) => {
    dispatch({ type: types.SAVING_RELATIONSHIPS });
    const parentEntityId = getState().relationships.list.sharedId;
    const hubs = getState().relationships.hubs.toJS();

    const apiCall = hubs.reduce((apiActions, hubData) => {
      if (!hubData.hub && !hubData.deleted) {
        const leftRelationship = Object.assign({ entity: parentEntityId }, hubData.leftRelationship);
        const rightRelationships = hubData.rightRelationships.reduce((relationships, rightGroup) => {
          if (!rightGroup.deleted) {
            const newRelationships = rightGroup.relationships.
            filter(r => !r.deleted);

            return relationships.concat(newRelationships);
          }

          return relationships;
        }, []);
        const fullHubData = [leftRelationship].concat(rightRelationships);
        apiActions.save.push(fullHubData);
      }

      if (hubData.hub) {
        if (hubData.deleted) {
          apiActions.delete.push({ _id: hubData.leftRelationship._id, entity: parentEntityId });
        }

        if (hubData.modified && !hubData.deleted) {
          apiActions.save.push(Object.assign({ entity: parentEntityId, hub: hubData.hub }, hubData.leftRelationship));
        }

        hubData.rightRelationships.forEach(rightGroup => {
          rightGroup.relationships.forEach(r => {
            const deleted = rightGroup.deleted || r.deleted || r.moved;

            if (deleted && r._id) {
              apiActions.delete.push(Object.assign({ _id: r._id, entity: r.entity }));
            }

            const toSave = rightGroup.modified || !r._id;
            if (toSave && !deleted) {
              apiActions.save.push(Object.assign(r, { entity: r.entity, hub: hubData.hub, template: rightGroup.template }));
            }
          });
        });
      }
      return apiActions;
    }, { save: [], delete: [] });

    return _api.default.post('relationships/bulk', new _RequestParams.RequestParams(apiCall)).
    then(response => Promise.all([
    response,
    _api.default.get('entities', new _RequestParams.RequestParams({ sharedId: parentEntityId })).then(r => r.json.rows[0]),
    reloadRelationships(parentEntityId)(dispatch, getState)])).

    then(([response, parentEntity]) => {
      dispatch(_BasicReducer.actions.set('entityView/entity', parentEntity));
      dispatch(_BasicReducer.actions.set('viewer/doc', parentEntity));

      dispatch(uiActions.closePanel());
      dispatch(edit(false, getState().relationships.list.searchResults, getState().relationships.list.entity));
      dispatch(_Viewer.referencesActions.loadReferences(parentEntityId));
      dispatch({ type: types.SAVED_RELATIONSHIPS, response });
      dispatch(_Notifications.notificationActions.notify('Relationships saved', 'success'));
    });
  };
}


function immidiateSearch(dispatch, searchTerm) {
  dispatch(uiActions.searching());

  const requestParams = new _RequestParams.RequestParams({ searchTerm, fields: ['title'], includeUnpublished: true });

  return _api.default.get('search', requestParams).
  then(response => {
    const results = response.json.rows;
    dispatch(_BasicReducer.actions.set('relationships/searchResults', results));
  });
}

const debouncedSearch = (0, _debounce.default)(immidiateSearch, 400);

function search(searchTerm) {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('relationships/searchTerm', searchTerm));
    return debouncedSearch(dispatch, searchTerm);
  };
}

function selectConnection(connection) {
  return _BasicReducer.actions.set('relationships/connection', connection);
}

function unselectConnection() {
  return _BasicReducer.actions.set('relationships/connection', {});
}