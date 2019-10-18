"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _default = {
  delta: 10,
  description: 'migration test 10',

  up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  } };exports.default = _default;