"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _files = require("../utils/files");
var _paths = _interopRequireDefault(require("../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


const storageConfig = {
  destination(req, file, cb) {
    const dir = req.route.path.includes('customisation') ?
    _paths.default.customUploads : _paths.default.uploadedDocuments;
    cb(null, _path.default.normalize(`${dir}/`));
  },
  filename(req, file, cb) {
    cb(null, (0, _files.generateFileName)(file));
  } };var _default =


storageConfig;exports.default = _default;