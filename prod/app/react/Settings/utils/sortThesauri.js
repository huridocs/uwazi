"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = sortThesauri;function sortThesauri(list) {
  list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return list;
}