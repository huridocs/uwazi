import Immutable from 'immutable';
import * as actions from '../actions/actionTypes';

export default function settingsUI(state = {}, action = {}) {
  if (action.type === actions.EDIT_LINK) {
    return state.set('editingLink', action.id);
  }

  if (action.type === actions.SAVING_NAVLINKS) {
    return state.set('savingNavlinks', true);
  }

  if (action.type === actions.NAVLINKS_SAVED) {
    return state.set('savingNavlinks', false);
  }

  return Immutable.fromJS(state);
}
