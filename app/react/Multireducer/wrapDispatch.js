const wrapAction = (action, reducerKey) => {
  action.__reducerKey = reducerKey;
  return action;
};

function wrapDispatch(dispatch, reducerKey) {
  const wrappedDispatch = action => {
    let wrappedAction = wrapAction(action, reducerKey);
    if (typeof action === 'function') {
      wrappedAction = (_globalDispatch, getState) => action(wrappedDispatch, getState);
    }

    return dispatch(wrappedAction);
  };

  return wrappedDispatch;
}

export { wrapDispatch };
