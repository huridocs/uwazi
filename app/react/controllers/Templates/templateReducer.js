import Immutable from 'immutable';
const initialState = Immutable.fromJS({name: '', properties: []});
import * as types from './actionTypes';

export default function fields(state = initialState, action = {}) {
  if (action.type === types.ADD_PROPERTY) {
    return state.updateIn(['properties'], (properties) => properties.insert(action.index, Immutable.fromJS(action.config)));
  }

  if (action.type === types.UPDATE_PROPERTY) {
    return state.updateIn(['properties', action.index], (original) => original.merge(Immutable.fromJS(action.config)));
  }

  if (action.type === types.REMOVE_PROPERTY) {
    return state.deleteIn(['properties', action.index]);
  }

  if (action.type === types.REORDER_PROPERTY) {
    let originProperty = state.get('properties').get(action.originIndex);
    let targetProperty = state.get('properties').get(action.targetIndex);

    return state.setIn(['properties', action.targetIndex], originProperty)
    .setIn(['properties', action.originIndex], targetProperty);
  }

  return state;
}
