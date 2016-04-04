import Immutable from 'immutable';

import * as types from 'app/Thesauris/actions/actionTypes';

const initialState = Immutable.fromJS([]);

export default function fields(state = initialState, action = {}) {
  if (action.type === types.SET_THESAURIS) {
    return Immutable.fromJS(action.thesauris);
  }

  if (action.type === types.THESAURI_DELETED) {
    return state.filter((thesauri) => thesauri.get('_id') !== action.id);
  }

  return state;
}
