"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _paths = _interopRequireDefault(require("../../../config/paths"));
var _PDF = _interopRequireDefault(require("../../../upload/PDF"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _default =

{
  delta: 3,

  name: 'fullText_to_per_page',

  description: 'change fullText, now text pages will be saved indexed in an object and pseudo formated with pdftotext',

  up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = db.collection('entities').find({ type: 'document' }, { _id: 1, file: 1 });
    return db.collection('entities').count({ type: 'document' }).
    then(totalDocuments => new Promise((resolve, reject) => {
      if (totalDocuments === 0) {
        return resolve();
      }
      let index = 1;
      cursor.on('data', entity => {
        cursor.pause();

        if (!entity.file || entity.file && !entity.file.filename) {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          if (index - 1 === totalDocuments) {
            return resolve();
          }
          cursor.resume();
          return;
        }

        if (!_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, entity.file.filename))) {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          if (index - 1 === totalDocuments) {
            return resolve();
          }
          cursor.resume();
          return;
        }

        new _PDF.default({ filename: _path.default.join(_paths.default.uploadedDocuments, entity.file.filename) }).extractText().
        then(conversion => {
          db.collection('entities').findOneAndUpdate(entity, { $set: _objectSpread({}, conversion) }, () => {
            process.stdout.write(`processed -> ${index}\r`);
            index += 1;
            if (index - 1 === totalDocuments) {
              return resolve();
            }
            cursor.resume();
          });
        }).catch(() => {
          db.collection('entities').findOneAndUpdate(entity, { $set: { fullText: { 1: '' } } }, () => {
            process.stdout.write(`processed -> ${index}\r`);
            index += 1;
            if (index - 1 === totalDocuments) {
              return resolve();
            }
            cursor.resume();
          });
        });
      });

      cursor.on('err', reject);
    }));
  } };exports.default = _default;