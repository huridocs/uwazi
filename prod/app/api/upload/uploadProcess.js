"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;var _events = _interopRequireDefault(require("events"));

var _entities = _interopRequireDefault(require("../entities"));
var _entitiesModel = _interopRequireDefault(require("../entities/entitiesModel"));

var _files = require("../utils/files");
var _PDF = _interopRequireDefault(require("./PDF"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const deleteIfUnused = async filename => {
  if (filename && !(await _entities.default.count({ 'file.filename': filename }))) {
    await (0, _files.deleteUploadedFile)(filename);
  }
};

const setUploaded = async (docs, file) =>
_entities.default.saveMultiple(
docs.map(doc => ({ _id: doc._id, file, uploaded: true })));


const removeOldFiles = async (docs) =>
Promise.all(
docs.filter(doc => doc.file).map(doc => deleteIfUnused(doc.file.filename)));


const processFile = async (docs, file) => {
  const pdf = new _PDF.default(file);
  const conversion = await pdf.convert();

  const convertedDocs = docs.map(doc => _objectSpread({}, doc, {}, conversion));
  await Promise.all(docs.map(doc => pdf.createThumbnail(doc._id.toString())));

  return _entitiesModel.default.save(
  convertedDocs.map(doc => _objectSpread({},
  doc, {
    file: _objectSpread({}, doc.file, { timestamp: Date.now() }) })));


};

class UploadFile extends _events.default {
  constructor(docs, file) {
    super();
    this.docs = docs;
    this.file = file;
  }

  async start() {
    try {
      await setUploaded(this.docs, this.file);
      await removeOldFiles(this.docs);

      this.emit('conversionStart');
      await processFile(this.docs, this.file);
    } catch (err) {
      await _entities.default.saveMultiple(
      this.docs.map(doc => ({ _id: doc._id, processed: false })));

      throw err;
    }
  }}


function _default(docs, file) {
  return new UploadFile(docs, file);
}