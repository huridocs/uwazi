"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.editProperty = editProperty;exports.setThesauris = setThesauris;var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function editProperty(id) {
  return {
    type: types.EDIT_PROPERTY,
    id };

}

function setThesauris(thesauris) {
  return {
    type: types.SET_THESAURIS,
    thesauris };

}