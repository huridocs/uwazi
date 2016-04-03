import Immutable from 'immutable';

import * as types from '~/Thesauris/actions/actionTypes';

const initialState = Immutable.fromJS({name: '', values: []});

export default function fields(state = initialState, action = {}) {
  return state;
}
