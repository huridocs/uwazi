"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _util = require("util");
var _fs = _interopRequireDefault(require("fs"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  writeFile: (0, _util.promisify)(_fs.default.writeFile),
  exists: (0, _util.promisify)(_fs.default.exists),
  unlink: (0, _util.promisify)(_fs.default.unlink),
  rename: (0, _util.promisify)(_fs.default.rename),
  readFile: (0, _util.promisify)(_fs.default.readFile),
  readdir: (0, _util.promisify)(_fs.default.readdir) };exports.default = _default;