import Immutable from 'immutable';

import * as actions from 'app/Pages/actions/actionTypes';

const initialState = {propertyBeingDeleted: null};

export default function templatesUI(state = initialState, action = {}) {
  if (action.type === actions.SAVING_PAGE) {
    return state.set('savingPage', true);
  }

  if (action.type === actions.PAGE_SAVED) {
    return state.set('savingPage', false);
  }

  return Immutable.fromJS(state);
}
