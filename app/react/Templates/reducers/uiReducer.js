import Immutable from 'immutable';

import * as actions from 'app/Templates/actions/actionTypes';

const initialState = {thesauris: [], templates: [], propertyBeingDeleted: null};

export default function templatesUI(state = initialState, action = {}) {
  if (action.type === actions.EDIT_PROPERTY) {
    return state.set('editingProperty', action.id);
  }

  if (action.type === actions.SET_THESAURIS) {
    return state.set('thesauris', action.thesauris);
  }

  if (action.type === actions.SET_TEMPLATES) {
    return state.set('templates', action.templates);
  }

  return Immutable.fromJS(state);
}
