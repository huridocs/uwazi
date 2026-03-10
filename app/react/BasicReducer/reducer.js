/** @format */

import Immutable from 'immutable';

const SET = 'SET';
const SET_IN = 'SET_IN';
const UPDATE = 'UPDATE';
const UPDATE_IN = 'UPDATE_IN';
const UNSET = 'UNSET';
const REMOVE = 'REMOVE';
const PUSH = 'PUSH';
const CONCAT = 'CONCAT';
const CONCAT_IN = 'CONCAT_IN';

export default function createReducer(namespace, defaultValue) {
  return (currentState = defaultValue, action = {}) => {
    let index;
    const indexKey = action.customIndex || '_id';

    switch (action.type) {
      case `${namespace}/${SET}`:
        return Immutable.fromJS(action.value);

      case `${namespace}/${SET_IN}`:
        return currentState.set(action.key, Immutable.fromJS(action.value));

      case `${namespace}/${UNSET}`:
        return Immutable.fromJS(defaultValue);

      case `${namespace}/${PUSH}`:
        return currentState.push(Immutable.fromJS(action.value));

      case `${namespace}/${CONCAT}`:
        return currentState.concat(Immutable.fromJS(action.value));

      case `${namespace}/${CONCAT_IN}`:
        return currentState.updateIn(action.key, collection =>
          collection.concat(Immutable.fromJS(action.value))
        );

      case `${namespace}/${REMOVE}`: {
        const key = action.customIndex || '_id';
        return Immutable.fromJS(currentState).filter(
          object => object.get(key) !== action.value[key]
        );
      }

      case `${namespace}/${UPDATE}`:
        if (currentState instanceof Immutable.Map) {
          return currentState.merge(action.value);
        }

        index = currentState.findIndex(o => o.get(indexKey) === action.value[indexKey]);
        if (index === -1) {
          return currentState.push(Immutable.fromJS(action.value));
        }
        return currentState.set(index, Immutable.fromJS(action.value));

      case `${namespace}/${UPDATE_IN}`:
        index = currentState
          .getIn(action.key)
          .findIndex(
            o =>
              o.get(action.customIndex || '_id') ===
              (action.customIndex ? action.value[action.customIndex] : action.value._id)
          );
        if (index === -1) {
          return currentState.updateIn(action.key, collection =>
            collection.push(Immutable.fromJS(action.value))
          );
        }
        return currentState.setIn([...action.key, index], Immutable.fromJS(action.value));

      default:
        return Immutable.fromJS(currentState);
    }
  };
}

export function update(namespace, value, customIndex) {
  return {
    type: `${namespace}/${UPDATE}`,
    value,
    customIndex,
  };
}

export function updateIn(namespace, key, value, customIndex = '') {
  return {
    type: `${namespace}/${UPDATE_IN}`,
    key,
    value,
    customIndex,
  };
}

export function set(namespace, value) {
  return {
    type: `${namespace}/${SET}`,
    value,
  };
}

export function setIn(namespace, key, value) {
  return {
    type: `${namespace}/${SET_IN}`,
    key,
    value,
  };
}

export function unset(namespace) {
  return {
    type: `${namespace}/${UNSET}`,
  };
}

export function push(namespace, value) {
  return {
    type: `${namespace}/${PUSH}`,
    value,
  };
}

export function concat(namespace, value) {
  return {
    type: `${namespace}/${CONCAT}`,
    value,
  };
}

export function concatIn(namespace, key, value) {
  return {
    type: `${namespace}/${CONCAT_IN}`,
    key,
    value,
  };
}

export function remove(namespace, value, customIndex) {
  return {
    type: `${namespace}/${REMOVE}`,
    value,
    customIndex,
  };
}

export const actions = {
  update,
  updateIn,
  set,
  setIn,
  unset,
  push,
  concat,
  concatIn,
  remove,
};
