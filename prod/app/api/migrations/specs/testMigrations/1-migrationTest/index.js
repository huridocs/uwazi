"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _default = {
  delta: 1,
  description: 'migration test 1',

  up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  } };exports.default = _default;