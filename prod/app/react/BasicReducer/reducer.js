"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = createReducer;exports.update = update;exports.updateIn = updateIn;exports.set = set;exports.unset = unset;exports.push = push;exports.concat = concat;exports.concatIn = concatIn;exports.remove = remove;exports.actions = void 0;var _immutable = _interopRequireDefault(require("immutable"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const SET = 'SET';
const UPDATE = 'UPDATE';
const UPDATE_IN = 'UPDATE_IN';
const UNSET = 'UNSET';
const REMOVE = 'REMOVE';
const PUSH = 'PUSH';
const CONCAT = 'CONCAT';
const CONCAT_IN = 'CONCAT_IN';

function createReducer(namespace, defaultValue) {
  return (currentState = defaultValue, action = {}) => {
    let index;

    switch (action.type) {
      case `${namespace}/${SET}`:
        return _immutable.default.fromJS(action.value);

      case `${namespace}/${UNSET}`:
        return _immutable.default.fromJS(defaultValue);

      case `${namespace}/${PUSH}`:
        return currentState.push(_immutable.default.fromJS(action.value));

      case `${namespace}/${CONCAT}`:
        return currentState.concat(_immutable.default.fromJS(action.value));

      case `${namespace}/${CONCAT_IN}`:
        return currentState.updateIn(action.key, collection => collection.concat(_immutable.default.fromJS(action.value)));

      case `${namespace}/${REMOVE}`:
        return _immutable.default.fromJS(currentState).filter(object => object.get('_id') !== action.value._id);

      case `${namespace}/${UPDATE}`:
        index = currentState.findIndex(o => o.get('_id') === action.value._id);
        if (index === -1) {
          return currentState.push(_immutable.default.fromJS(action.value));
        }
        return currentState.set(index, _immutable.default.fromJS(action.value));

      case `${namespace}/${UPDATE_IN}`:
        index = currentState.getIn(action.key).findIndex(o => o.get('_id') === action.value._id);
        if (index === -1) {
          return currentState.updateIn(action.key, collection => collection.push(_immutable.default.fromJS(action.value)));
        }
        return currentState.setIn([...action.key, index], _immutable.default.fromJS(action.value));

      default:
        return _immutable.default.fromJS(currentState);}

  };
}

function update(namespace, value) {
  return {
    type: `${namespace}/${UPDATE}`,
    value };

}

function updateIn(namespace, key, value) {
  return {
    type: `${namespace}/${UPDATE_IN}`,
    key,
    value };

}

function set(namespace, value) {
  return {
    type: `${namespace}/${SET}`,
    value };

}

function unset(namespace) {
  return {
    type: `${namespace}/${UNSET}` };

}

function push(namespace, value) {
  return {
    type: `${namespace}/${PUSH}`,
    value };

}

function concat(namespace, value) {
  return {
    type: `${namespace}/${CONCAT}`,
    value };

}

function concatIn(namespace, key, value) {
  return {
    type: `${namespace}/${CONCAT_IN}`,
    key,
    value };

}

function remove(namespace, value) {
  return {
    type: `${namespace}/${REMOVE}`,
    value };

}

const actions = {
  update,
  updateIn,
  set,
  unset,
  push,
  concat,
  concatIn,
  remove };exports.actions = actions;