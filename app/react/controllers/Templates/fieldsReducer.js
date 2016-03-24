import Immutable from 'immutable';
const initialState = Immutable.fromJS([]);

export default function fields(state = initialState, action = {}) {
  if (action.type === 'ADD_FIELD') {
    return state.push(Immutable.fromJS({fieldType: action.fieldType}));
  }

  return state;
}
