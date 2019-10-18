"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function (obj) {return typeof obj;};} else {_typeof = function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}var _default = {
  parseNested(object) {
    if (_typeof(object) !== 'object') {
      return object;
    }
    const result = Object.assign({}, object);
    Object.keys(object).forEach(index => {
      try {
        result[index] = JSON.parse(object[index]);
      } catch (e) {
        result[index] = object[index];
      }
    });
    return result;
  } };exports.default = _default;