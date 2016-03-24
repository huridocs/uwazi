const initialState = {
  fields: [
    {type: 'input'}
  ]
};

export default function reducer(state = initialState, action) {
  let newState = {fields: state.fields.slice(0)};
  newState.fields.push({type: 'input'});
  console.log(state, newState);
  return newState;
}
