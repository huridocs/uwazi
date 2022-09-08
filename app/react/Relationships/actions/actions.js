import api from 'app/utils/api';
import { actions } from 'app/BasicReducer';
import debounce from 'app/utils/debounce';
import { createSelector } from 'reselect';
import { notificationActions } from 'app/Notifications';
import { referencesActions } from 'app/Viewer';
import { RequestParams } from 'app/utils/RequestParams';
import SearchApi from 'app/Search/SearchAPI';
import { t } from 'app/I18N';
import EntitiesApi from '../../Entities/EntitiesAPI';
import * as types from './actionTypes';
import * as uiActions from './uiActions';
import * as routeUtils from '../utils/routeUtils';

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

function updateRelationshipEntityData(entity) {
  return { type: types.UPDATE_RELATIONSHIP_ENTITY_DATA, entity };
}

function updateRightRelationshipType(index, rightIndex, _id) {
  return (dispatch, getState) => {
    const { hubs } = getState().relationships;
    const newRightRelationshipType =
      rightIndex === hubs.getIn([index, 'rightRelationships']).size - 1;

    dispatch({
      type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE,
      index,
      rightIndex,
      _id,
      newRightRelationshipType,
    });

    if (newRightRelationshipType) {
      dispatch(setAddToData(index, rightIndex));
      dispatch(uiActions.openPanel());
    }
  };
}

function addEntity(index, rightIndex, entity, errors = []) {
  return dispatch => {
    const title = entity.title.length > 75 ? `${entity.title.slice(0, 75)}(...)` : entity.title;
    let message = t('System', 'added to hub.', null, false);

    if (errors.length) {
      message = `${t(
        'System',
        'added to hub with the following errors:',
        null,
        false
      )} ${JSON.stringify(errors, null)}.`;
    }

    const notificationMessage = `${title} ${message}\n${t(
      'System',
      'Save your work to make change permanent',
      null,
      false
    )}.`;

    dispatch(
      notificationActions.notify(notificationMessage, errors.length ? 'warning' : 'success')
    );
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
  return (dispatch, getState) =>
    routeUtils
      .requestState(new RequestParams({ sharedId }), getState())
      .then(([connectionsGroups, searchResults]) => {
        dispatch(actions.set('relationships/list/connectionsGroups', connectionsGroups));
        dispatch(actions.set('relationships/list/searchResults', searchResults));
      });
}

function saveRelationships() {
  return (dispatch, getState) => {
    dispatch({ type: types.SAVING_RELATIONSHIPS });
    const parentEntityId = getState().relationships.list.sharedId;
    const hubs = getState().relationships.hubs.toJS();

    const apiCall = hubs.reduce(
      (apiActions, hubData) => {
        if (!hubData.hub && !hubData.deleted) {
          const leftRelationship = { entity: parentEntityId, ...hubData.leftRelationship };
          const rightRelationships = hubData.rightRelationships.reduce(
            (relationships, rightGroup) => {
              if (!rightGroup.deleted) {
                const newRelationships = rightGroup.relationships.filter(r => !r.deleted);

                return relationships.concat(newRelationships);
              }
              return relationships;
            },
            []
          );
          const fullHubData = [leftRelationship].concat(rightRelationships);
          apiActions.save.push(fullHubData);
        }

        if (hubData.hub) {
          if (hubData.deleted) {
            apiActions.delete.push({ _id: hubData.leftRelationship._id, entity: parentEntityId });
          }

          if (hubData.modified && !hubData.deleted) {
            apiActions.save.push({
              entity: parentEntityId,
              hub: hubData.hub,
              ...hubData.leftRelationship,
            });
          }

          hubData.rightRelationships.forEach(rightGroup => {
            rightGroup.relationships.forEach(r => {
              const deleted = rightGroup.deleted || r.deleted || r.moved;

              if (deleted && r._id) {
                apiActions.delete.push({ _id: r._id, entity: r.entity });
              }

              const toSave = rightGroup.modified || !r._id;
              if (toSave && !deleted) {
                apiActions.save.push(
                  Object.assign(r, {
                    entity: r.entity,
                    hub: hubData.hub,
                    template: rightGroup.template,
                  })
                );
              }
            });
          });
        }
        return apiActions;
      },
      { save: [], delete: [] }
    );

    return api
      .post('relationships/bulk', new RequestParams(apiCall))
      .then(response =>
        Promise.all([
          response,
          EntitiesApi.get(new RequestParams({ sharedId: parentEntityId })).then(([r]) => r),
          reloadRelationships(parentEntityId)(dispatch, getState),
        ])
      )
      .then(([response, parentEntity]) => {
        dispatch(actions.set('entityView/entity', parentEntity));
        dispatch(actions.set('viewer/doc', parentEntity));

        dispatch(uiActions.closePanel());
        dispatch(
          edit(
            false,
            getState().relationships.list.searchResults,
            getState().relationships.list.entity
          )
        );
        dispatch(referencesActions.loadReferences(parentEntityId));
        dispatch({ type: types.SAVED_RELATIONSHIPS, response });
        dispatch(
          notificationActions.notify(t('System', 'Relationships saved', null, false), 'success')
        );
      })
      .catch(e => {
        dispatch({ type: types.SAVED_RELATIONSHIPS, e });
      });
  };
}

function immidiateSearch(dispatch, searchTerm) {
  dispatch(uiActions.searching());

  const requestParams = new RequestParams({
    searchTerm,
    fields: ['title'],
    includeUnpublished: true,
  });

  return SearchApi.search(requestParams).then(({ rows: results }) => {
    dispatch(actions.set('relationships/searchResults', results));
  });
}

const debouncedSearch = debounce(immidiateSearch, 400);

const selectRelationTypes = createSelector(
  state => state.translations,
  state => state.relationTypes,
  state => state.locale,
  (translations, relationTypes, locale) => {
    const translationContexts = translations.find(
      translation => translation.get('locale') === locale
    );
    const relations = relationTypes.toJS().map(rel => {
      const [translationContext] = translationContexts
        .get('contexts')
        .filter(context => context.get('id') === rel._id);
      const name = translationContext
        ? t(translationContext.get('id'), rel.name, null, false)
        : rel.name;
      return {
        ...rel,
        name,
      };
    });
    return [{ _id: null, name: t('System', 'No Label', null, false) }].concat(relations);
  }
);

function search(searchTerm) {
  return dispatch => {
    dispatch(actions.set('relationships/searchTerm', searchTerm));
    return debouncedSearch(dispatch, searchTerm);
  };
}

function selectConnection(connection) {
  return actions.set('relationships/connection', connection);
}

function unselectConnection() {
  return actions.set('relationships/connection', {});
}

export {
  unselectConnection,
  selectConnection,
  search,
  selectRelationTypes,
  immidiateSearch,
  saveRelationships,
  reloadRelationships,
  toggleRemoveEntity,
  toggleMoveEntity,
  moveEntities,
  addEntity,
  updateRightRelationshipType,
  updateRelationshipEntityData,
  setAddToData,
  parseResults,
  edit,
  addHub,
  toggelRemoveLeftRelationship,
  toggleRemoveRightRelationshipGroup,
  updateLeftRelationshipType,
};
