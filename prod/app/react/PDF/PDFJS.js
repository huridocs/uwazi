"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.textLayerFactory = exports.default = void 0;
var _utils = require("../utils");function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

let PDFJS = {};
let pdfjsLib = {};
let textLayerFactory = {};exports.textLayerFactory = textLayerFactory;
if (_utils.isClient) {
  require("../../../node_modules/pdfjs-dist/web/pdf_viewer.css");

  PDFJS = require("../../../node_modules/pdfjs-dist/web/pdf_viewer.js");
  if (process.env.HOT || process.env.NODE_ENV === 'test') {
    pdfjsLib = require('pdfjs-dist');
    // pdfjsLib.workerSrc = 'http://localhost:8080/pdf.worker.js';
  } else {
    pdfjsLib = require('pdfjs-dist/webpack');
  }
  exports.textLayerFactory = textLayerFactory = new PDFJS.DefaultTextLayerFactory();
}var _default = _objectSpread({},

PDFJS, {}, pdfjsLib);exports.default = _default;