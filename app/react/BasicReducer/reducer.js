import Immutable from 'immutable';

const SET = 'SET';
const UPDATE = 'UPDATE';
const UNSET = 'UNSET';
const REMOVE = 'REMOVE';
const PUSH = 'PUSH';

export default function createReducer(namespace, defaultValue) {
  return (currentState = defaultValue, action = {}) => {
    let index;

    switch (action.type) {
    case `${namespace}/${SET}`:
      return Immutable.fromJS(action.value);

    case `${namespace}/${UNSET}`:
      return Immutable.fromJS(defaultValue);

    case `${namespace}/${PUSH}`:
      return currentState.push(Immutable.fromJS(action.value));

    case `${namespace}/${REMOVE}`:
      return Immutable.fromJS(currentState).filter(object => object.get('_id') !== action.value._id);

    case `${namespace}/${UPDATE}`:
      index = currentState.findIndex(o => o.get('_id') === action.value._id);
      if (index === -1) {
        return currentState.push(Immutable.fromJS(action.value));
      }
      return currentState.set(index, Immutable.fromJS(action.value));

    default:
      return Immutable.fromJS(currentState);
    }
  };
}

export function update(namespace, value) {
  return {
    type: `${namespace}/${UPDATE}`,
    value
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

export function push(namespace, value) {
  return {
    type: `${namespace}/${PUSH}`,
    value
  };
}

export function remove(namespace, value) {
  return {
    type: `${namespace}/${REMOVE}`,
    value
  };
}
