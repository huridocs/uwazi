"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _PDF = _interopRequireDefault(require("../../../upload/PDF"));
var _path = _interopRequireDefault(require("path"));
var _paths = _interopRequireDefault(require("../../../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable no-await-in-loop */var _default =

{
  delta: 4,

  name: 'pdf_thumbnails',

  description: 'Creating PDF thubmnails for all documents',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const cursor = db.collection('entities').find({ type: 'document' });
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.file && doc.file.filename) {
        await new _PDF.default({
          filename: _path.default.join(_paths.default.uploadedDocuments, doc.file.filename) }).
        createThumbnail(doc._id.toString());
        process.stdout.write(`processed -> ${index}\r`);
        index += 1;
      }
    }
    process.stdout.write('\r\n');
  } };exports.default = _default;