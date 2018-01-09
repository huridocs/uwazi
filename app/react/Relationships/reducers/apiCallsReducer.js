import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {changed: [], deleted: []};

export default function (state = initialState, action = {}) {
  let changed;
  let deleted;

  switch (action.type) {

  case types.REMOVE_RELATIONSHIPS_LEFT:
    deleted = state.get('deleted')
    .push(action.hub.getIn(['leftRelationship', '_id']))
    .filter(v => Boolean(v));

    return state.set('deleted', deleted);

  case types.REMOVE_RELATIONSHIPS_RIGHT_GROUP:
    const afectedRelationships = action.hub
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

  default:
    return fromJS(state);
  }
}
