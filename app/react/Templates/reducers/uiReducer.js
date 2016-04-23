import Immutable from 'immutable';

import * as actions from 'app/Templates/actions/actionTypes';

const initialState = {thesauri: [], propertyBeingDeleted: null};

export default function templatesUI(state = initialState, action = {}) {
  if (action.type === actions.EDIT_PROPERTY) {
    return state.set('editingProperty', action.id);
  }

  if (action.type === actions.SET_THESAURI) {
    return state.set('thesauri', action.thesauri);
  }

  if (action.type === actions.SHOW_REMOVE_PROPERTY_CONFIRM) {
    return state.set('propertyBeingDeleted', action.propertyId);
  }

  if (action.type === actions.HIDE_REMOVE_PROPERTY_CONFIRM) {
    return state.set('propertyBeingDeleted', null);
  }

  return Immutable.fromJS(state);
}
