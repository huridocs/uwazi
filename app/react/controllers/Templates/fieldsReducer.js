import Immutable from 'immutable';
const initialState = [];

export default function fields(state = initialState, action = {}) {
  if (action.type === 'ADD_FIELD') {
    return state.push(Immutable.fromJS({type: 'input'}));
  }

  return state;
}
