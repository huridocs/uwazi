"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = blankState;var _store = require("../../store");
var _utils = require("../../utils");

function blankState() {
  const state = _store.store.getState();
  if (!_utils.isClient) {
    return false;
  }
  return !state.thesauris.reduce((r, t) => r || !!t.get('values').size, false);
}