"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.deleteFiles = deleteFiles;exports.deleteFile = deleteFile;exports.getFileContent = exports.streamToString = exports.fileFromReadStream = exports.generateFileName = exports.deleteUploadedFile = void 0;var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));

var _uniqueID = _interopRequireDefault(require("../../shared/uniqueID"));
var _asyncFs = _interopRequireDefault(require("./async-fs"));

var _paths = _interopRequireDefault(require("../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function deleteFile(file) {
  return new Promise((resolve, reject) => {
    _fs.default.unlink(file, err => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      }
      resolve();
    });
  });
}

function deleteFiles(files) {
  return Promise.all(files.map(file => deleteFile(file)));
}

const deleteUploadedFile = (filename) =>
deleteFile(_path.default.join(_paths.default.uploadedDocuments, filename));exports.deleteUploadedFile = deleteUploadedFile;

const generateFileName = (file) =>
Date.now() + (0, _uniqueID.default)() + _path.default.extname(file.originalname);exports.generateFileName = generateFileName;

const fileFromReadStream = (fileName, readStream) =>
new Promise((resolve, reject) => {
  const filePath = _path.default.join(_paths.default.uploadedDocuments, fileName);
  const writeStream = _fs.default.createWriteStream(filePath);
  readStream.pipe(writeStream).
  on('finish', () => resolve(filePath)).
  on('error', reject);
});exports.fileFromReadStream = fileFromReadStream;

const streamToString = stream => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};exports.streamToString = streamToString;

const getFileContent = fileName => {
  const filePath = _path.default.join(_paths.default.uploadedDocuments, fileName);
  return _asyncFs.default.readFile(filePath, 'utf8');
};exports.getFileContent = getFileContent;