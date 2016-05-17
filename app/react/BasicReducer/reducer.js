import Immutable from 'immutable';

const SET = 'SET';
const UNSET = 'UNSET';

export default function createReducer(namespace, defaultValue) {
  return (currentState = defaultValue, action = {}) => {
    if (action.type === `${namespace}/${SET}`) {
      return Immutable.fromJS(action.value);
    }
    if (action.type === `${namespace}/${UNSET}`) {
      return Immutable.fromJS(defaultValue);
    }
    return Immutable.fromJS(currentState);
  };
}

export function set(namespace, value) {
  return {
    type: `${namespace}/${SET}`,
    value
  };
}

export function unset(namespace) {
  return {
    type: `${namespace}/${UNSET}`
  };
}
