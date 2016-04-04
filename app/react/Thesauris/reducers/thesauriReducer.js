import Immutable from 'immutable';

import * as types from '~/Thesauris/actions/actionTypes';

const initialState = Immutable.fromJS({name: '', values: []});

export default function fields(state = initialState, action = {}) {
  if (action.type === types.EDIT_THESAURI) {
    return Immutable.fromJS(action.thesauri);
  }

  if (action.type === types.RESET_THESAURI) {
    return initialState;
  }

  return state;
}
