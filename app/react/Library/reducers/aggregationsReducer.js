import { createReducer, actions } from '#app/BasicReducer/index.js';
import * as types from '#app/Library/actions/actionTypes.js';

const reducer = createReducer('aggregations', {});

const aggregationsReducer = (state, _action = {}) => {
  let action = _action;
  if (action.type === types.INITIALIZE_FILTERS_FORM) {
    action = actions.set('aggregations', action.aggregations);
  }

  return reducer(state, action);
};

export { reducer, aggregationsReducer };
