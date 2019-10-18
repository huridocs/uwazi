"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _default = {
  delta: 2,
  description: 'migration test 2',

  up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  } };exports.default = _default;