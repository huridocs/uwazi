import createReducer, { actions } from '../../BasicReducer/index.js';
import * as types from '../../Library/actions/actionTypes.js';

const reducer = createReducer('aggregations', {});

export default function aggregations(state, _action = {}) {
  let action = _action;
  if (action.type === types.INITIALIZE_FILTERS_FORM) {
    action = actions.set('aggregations', action.aggregations);
  }

  return reducer(state, action);
}
