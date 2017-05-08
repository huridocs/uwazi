const wrapAction = (action, reducerKey) => {
  action.__reducerKey = reducerKey;
  return action;
};

export default function wrapDispatch(dispatch, reducerKey) {
  const wrappedDispatch = (action) => {
    let wrappedAction = wrapAction(action, reducerKey);
    if (typeof action === 'function') {
      wrappedAction = (globalDispatch, getState) => {
        return action(wrappedDispatch, getState);
      };
    }

    return dispatch(wrappedAction);
  };

  return wrappedDispatch;
}
