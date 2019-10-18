"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;function _default(reducer, reducerKey) {
  return function (state, action) {
    if (action.__reducerKey === reducerKey) {
      return reducer(state, action);
    }

    return reducer(state, {});
  };
}