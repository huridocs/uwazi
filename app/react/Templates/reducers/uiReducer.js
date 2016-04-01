import Immutable from 'immutable';

import * as actions from '~/Templates/actions/actionTypes';

const initialState = Immutable.fromJS({});

export default function templatesUI(state = initialState, action = {}) {
  if (action.type === actions.EDIT_PROPERTY) {
    return state.set('editingProperty', action.id);
  }

  return state;
}
