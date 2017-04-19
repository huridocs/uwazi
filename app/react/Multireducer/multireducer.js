export default function (reducer, reducerKey) {
  return function (state, action) {
    if (action.__reducerKey === reducerKey) {
      return reducer(state, action);
    }

    return reducer(state, {});
  };
}
