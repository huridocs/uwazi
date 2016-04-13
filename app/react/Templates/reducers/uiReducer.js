import Immutable from 'immutable';

import * as actions from 'app/Templates/actions/actionTypes';

const initialState = {thesauri: []};

export default function templatesUI(state = initialState, action = {}) {
  if (action.type === actions.EDIT_PROPERTY) {
    return state.set('editingProperty', action.id);
  }

  if (action.type === actions.SET_THESAURI) {
    return state.set('thesauri', action.thesauri);
  }

  return Immutable.fromJS(state);
}
