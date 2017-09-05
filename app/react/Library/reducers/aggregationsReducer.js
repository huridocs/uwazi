import createReducer, {actions} from 'app/BasicReducer';
import * as types from 'app/Library/actions/actionTypes';

let reducer = createReducer('aggregations', {});

export default function aggregations(state, _action = {}) {
  let action = _action;

  if (action.type === types.INITIALIZE_FILTERS_FORM) {
    action = actions.set('aggregations', action.aggregations);
  }

  return reducer(state, action);
}
