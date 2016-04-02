import Immutable from 'immutable';

import * as types from '~/Thesauris/actions/actionTypes';

const initialState = Immutable.fromJS({name: '', values: []});

export default function fields(state = initialState, action = {}) {
  if (action.type === types.ADD_THESAURI_VALUE) {
    return state.updateIn(['values'], (values) => values.push(Immutable.fromJS({label: ''})));
  }
  return state;
}
