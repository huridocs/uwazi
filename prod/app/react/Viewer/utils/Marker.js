"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _utils = require("../../utils");

let Mark;
if (_utils.isClient) {
  Mark = require('mark.js');
  window.Marker = Mark;
}


let marker;var _default =
{
  init(selector) {
    marker = new Mark(selector);
    if (_utils.isClient) {
      window.Marker = marker;
    }
  },

  markRegExp(regexp, options) {
    marker.markRegExp(regexp, options);
  },

  mark(text, options) {
    marker.mark(text, options);
  },

  unmark() {
    marker.unmark();
  } };exports.default = _default;