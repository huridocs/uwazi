"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const importedVaultEvidences = new _mongoose.default.Schema({
  request: String });


const Model = (0, _odm.default)('importedVaultEvidences', importedVaultEvidences);var _default =

Model;exports.default = _default;