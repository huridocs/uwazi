import Immutable from 'immutable';
const initialState = Immutable.fromJS([{name: 'template one'}, {name: 'tempalte two'}, {name: 'template three'}, {name: 'tempalte four'}]);

export default function fields(state = initialState) {
  return state;
}
