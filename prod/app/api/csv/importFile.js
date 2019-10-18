"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _stream = require("stream");

var _files = require("../utils/files");
var _utils = require("../utils");
var _zipFile = _interopRequireDefault(require("../utils/zipFile"));

var _paths = _interopRequireDefault(require("../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const extractFromZip = async (filePath, fileName) => {
  const readStream = await (0, _zipFile.default)(filePath).
  findReadStream(entry => entry.fileName === fileName);

  if (!readStream) {
    throw (0, _utils.createError)(`${fileName} file not found`);
  }

  return readStream;
};

const importFile = filePath => ({
  async readStream(fileName = 'import.csv') {
    if (filePath instanceof _stream.Readable) {
      return filePath;
    }
    if (_path.default.extname(filePath) === '.zip') {
      return extractFromZip(filePath, fileName);
    }
    return _fs.default.createReadStream(filePath);
  },

  async extractFile(fileName) {
    const generatedName = (0, _files.generateFileName)({ originalname: fileName });

    await (0, _files.fileFromReadStream)(generatedName, (await this.readStream(fileName)));

    return {
      destination: _paths.default.uploadedDocuments,
      originalname: fileName,
      filename: generatedName };

  } });var _default =


importFile;exports.default = _default;