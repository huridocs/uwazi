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

  if (action.type === actions.SAVING_TEMPLATE) {
    return state.set('savingTemplate', true);
  }

  if (action.type === actions.TEMPLATE_SAVED) {
    return state.set('savingTemplate', false);
  }

  return Immutable.fromJS(state);
}
