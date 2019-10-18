"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;function _default(obj, keys = []) {
  const target = Object.assign({}, obj);

  keys.forEach(key => {
    delete target[key];
  });

  return target;
}