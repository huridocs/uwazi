"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _asyncFs = _interopRequireDefault(require("../../../utils/async-fs"));
var _paths = _interopRequireDefault(require("../../../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable no-await-in-loop */var _default =

{
  delta: 14,

  name: 'separate-custom-uploads-from-documents',

  description: 'Moves custom uploads to their own separate folder from uploaded documents',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const uploads = await db.collection('uploads').find();
    let index = 1;
    while (await uploads.hasNext()) {
      const { filename } = await uploads.next();

      const oldPath = _path.default.join(_paths.default.uploadedDocuments, filename);
      const newPath = _path.default.join(_paths.default.customUploads, filename);
      try {
        await _asyncFs.default.rename(oldPath, newPath);
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }
      }

      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  } };exports.default = _default;