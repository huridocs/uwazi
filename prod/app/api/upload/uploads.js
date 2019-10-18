"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));

var _paths = _interopRequireDefault(require("../config/paths"));
var _uploadsModel = _interopRequireDefault(require("./uploadsModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const deleteFile = filename => new Promise((resolve, reject) => {
  _fs.default.unlink(_path.default.join(_paths.default.customUploads, filename), err => {
    if (err) {
      reject(err);
    }
    resolve();
  });
});var _default =

{
  save: _uploadsModel.default.save.bind(_uploadsModel.default),

  get: _uploadsModel.default.get.bind(_uploadsModel.default),

  async delete(_id) {
    const upload = await _uploadsModel.default.getById(_id);

    await _uploadsModel.default.delete(_id);
    await deleteFile(upload.filename);

    return upload;
  } };exports.default = _default;