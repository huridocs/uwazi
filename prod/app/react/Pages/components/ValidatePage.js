"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;function validateTitle() {
  return {
    required: val => val && val.trim() !== '' };

}

function _default() {
  const validator = {
    '': {},
    title: validateTitle() };


  return validator;
}