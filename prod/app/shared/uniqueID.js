"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;exports.mockID = mockID;Math.uniqueID = () => Math.random().toString(36).substr(2);

function _default() {
  return Math.uniqueID();
}

function mockID(uniqueID = 'unique_id') {
  spyOn(Math, 'uniqueID').and.returnValue(uniqueID);
}