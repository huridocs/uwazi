import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {changed: [], deleted: [], saving: false};

export default function (state = initialState, action = {}) {
  let changed;
  let deleted;
  let afectedRelationships;

  switch (action.type) {

  case types.REMOVE_RELATIONSHIPS_LEFT:
    deleted = state.get('deleted')
    .push(action.hub.getIn(['leftRelationship', '_id']))
    .filter(v => Boolean(v));

    return state.set('deleted', deleted);

  case types.REMOVE_RELATIONSHIPS_RIGHT_GROUP:
    afectedRelationships = action.hub
    .getIn(['rightRelationships', action.rightIndex, 'relationships'])
    .map(relationship => relationship.get('_id'))
    .filter(v => Boolean(v));

    deleted = state.get('deleted')
    .concat(afectedRelationships);

    return state.set('deleted', deleted);

  case types.REMOVE_RELATIONSHIPS_ENTITY:
    deleted = state.get('deleted')
    .push(action.hub.getIn(['rightRelationships', action.rightIndex, 'relationships', action.relationshipIndex, '_id']))
    .filter(v => Boolean(v));

    return state.set('deleted', deleted);

  case types.UPDATE_RELATIONSHIPS_LEFT_TYPE:
    changed = state.get('changed')
    .push(action.hub.getIn(['leftRelationship', '_id']))
    .filter(v => Boolean(v));

    return state.set('changed', changed);

  case types.UPDATE_RELATIONSHIPS_RIGHT_TYPE:

    afectedRelationships = action.hub
    .getIn(['rightRelationships', action.rightIndex, 'relationships'])
    .map(relationship => relationship.get('_id'))
    .filter(v => Boolean(v));

    changed = state.get('changed')
    .concat(afectedRelationships);

    return state.set('changed', changed);

  case types.SAVING_RELATIONSHIPS:
    console.log('Saving...');
    return state.set('saving', true);

  default:
    return fromJS(state);
  }
}
