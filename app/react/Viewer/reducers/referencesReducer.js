import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = [];

export default function referencesReducer(state = initialState, action = {}) {
  if (action.type === types.SET_REFERENCES) {
    return Immutable.fromJS(action.references);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return Immutable.fromJS(initialState);
  }

  if (action.type === types.ADD_REFERENCE) {
    return state.push(Immutable.fromJS(action.reference));
  }

  if (action.type === types.REMOVE_REFERENCE) {
    const hubRelationships = state.filter(r => r.get('hub') === action.reference.hub);
    if (hubRelationships.size <= 2) {
      return state.filter(r => r.get('hub') !== action.reference.hub);
    }

    return state.filter(r => r.get('_id') !== action.reference.associatedRelationship._id);
  }

  return Immutable.fromJS(state);
}
