"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _events = _interopRequireDefault(require("events"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _languages = _interopRequireDefault(require("../../shared/languages"));
var _childProcessPromise = require("child-process-promise");
var _errorLog = _interopRequireDefault(require("../log/errorLog"));
var _utils = require("../utils");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

class PDF extends _events.default {
  constructor(file) {
    super();
    this.file = file;
    this.filepath = _path.default.join(file.destination || '', file.filename || '');
  }

  getThumbnailPath(documentId) {
    return _path.default.join(_path.default.dirname(this.filepath), documentId);
  }

  async extractText() {
    try {
      const result = await (0, _childProcessPromise.spawn)('pdftotext', [this.filepath, '-'], { capture: ['stdout', 'stderr'] });
      const pages = result.stdout.split('\f').slice(0, -1);
      return {
        fullText: pages.reduce(
        (memo, page, index) => _objectSpread({},
        memo, {
          [index + 1]: page.replace(/(\S+)(\s?)/g, `$1[[${index + 1}]]$2`) }),

        {}),

        fullTextWithoutPages: pages.reduce(
        (memo, page, index) => _objectSpread({},
        memo, {
          [index + 1]: page }),

        {}),

        totalPages: pages.length };

    } catch (e) {
      if (e.name === 'ChildProcessError') {
        throw (0, _utils.createError)(`${e.message}\nstderr output:\n${e.stderr}`);
      }
      throw (0, _utils.createError)(e.message);
    }
  }

  async createThumbnail(documentId) {
    let response;
    try {
      response = await (0, _childProcessPromise.spawn)(
      'pdftoppm',
      ['-f', '1', '-singlefile', '-scale-to', '320', '-jpeg', this.filepath, this.getThumbnailPath(documentId)],
      { capture: ['stdout', 'stderr'] });

    } catch (err) {
      response = err;
      _errorLog.default.error(`Thumbnail creation error for: ${this.filepath}`);
    }

    return Promise.resolve(response);
  }

  deleteThumbnail(documentId) {
    return new Promise(resolve => {
      _fs.default.unlink(`${this.getThumbnailPath(documentId)}.jpg`, err => {
        if (err) {_errorLog.default.error(`Thumbnail deletion error for: ${this.getThumbnailPath(documentId)}`);}
        resolve();
      });
    });
  }

  generateFileInfo(conversion) {
    return _objectSpread({},
    this.file, {
      language: _languages.default.detect(
      Object.values(conversion.fullTextWithoutPages).join(''),
      'franc') });


  }

  convert() {
    return this.extractText().
    then(conversion => _objectSpread({},
    conversion, {
      file: this.generateFileInfo(conversion),
      processed: true,
      toc: [] }));

  }}exports.default = PDF;