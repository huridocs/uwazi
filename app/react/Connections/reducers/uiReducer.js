import Immutable from '#shared/immutableWrapper.js';
import * as types from '#app/Connections/actions/actionTypes.js';

const initialState = { open: false, connecting: false };

const uiReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case types.OPEN_CONNECTION_PANEL:
      return state.set('open', true);

    case types.CLOSE_CONNECTION_PANEL:
      return state.set('connecting', false).set('open', false);

    case types.SEARCHING_CONNECTIONS:
      return state.set('searching', true);

    case 'connections/searchResults/SET':
      return state.set('searching', false);

    case types.CREATING_CONNECTION:
      return state.set('creating', true);

    case types.CREATING_RANGED_CONNECTION:
      return state.set('connecting', true);

    case types.CANCEL_RANGED_CONNECTION:
      return state.set('connecting', false);

    case types.CONNECTION_CREATED:
      return state.set('creating', false).set('connecting', false).set('open', false);

    default:
      return Immutable.fromJS(state);
  }
};

export { uiReducer };
