"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.filterOptions = filterOptions;exports.default = void 0;var _diacritics = require("diacritics");

function matchesFilter(subject, filter) {
  return (0, _diacritics.remove)(subject.toLowerCase()).includes((0, _diacritics.remove)(filter.toLowerCase()));
}

function filterOptions(filter, options, optionsLabel) {
  return options.filter(opt => matchesFilter(opt[optionsLabel], filter) ||
  opt.options && opt.options.some(childOpt => matchesFilter(childOpt[optionsLabel], filter)));

}var _default =

{
  filterOptions };exports.default = _default;