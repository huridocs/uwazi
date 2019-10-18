"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.fileExists = exports.createTestingZip = exports.stream = void 0;var _path = _interopRequireDefault(require("path"));
var _yazl = _interopRequireDefault(require("yazl"));
var _fs = _interopRequireDefault(require("fs"));
var _stream = require("stream");

var _asyncFs = _interopRequireDefault(require("../../utils/async-fs"));

var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const createTestingZip = (filesToZip, fileName, directory = __dirname) =>
new Promise((resolve, reject) => {
  const zipfile = new _yazl.default.ZipFile();

  filesToZip.forEach(file => {
    zipfile.addFile(file, _path.default.basename(file));
  });

  zipfile.end();
  zipfile.outputStream.
  pipe(_fs.default.createWriteStream(_path.default.join(directory, `/zipData/${fileName}`))).
  on('close', resolve).
  on('error', reject);
});exports.createTestingZip = createTestingZip;

const fileExists = async (fileName) =>
_asyncFs.default.exists(_path.default.join(_paths.default.uploadedDocuments, fileName));exports.fileExists = fileExists;

const stream = (string) =>
new _stream.Readable({
  read() {
    this.push(string);
    this.push(null);
  } });exports.stream = stream;