import Immutable from 'immutable';

import * as types from '~/Thesauris/actions/actionTypes';

const initialState = Immutable.fromJS([]);

export default function fields(state = initialState, action = {}) {
  if (action.type === types.SET_THESAURIS) {
    return Immutable.fromJS(action.thesauris);
  }

  return state;
}
