"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;require("isomorphic-fetch");
var _semanticsearch = _interopRequireDefault(require("../config/semanticsearch"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const semanticSearchAPI = {
  async processDocument(args) {
    const res = await fetch(_semanticsearch.default, {
      method: 'POST',
      body: JSON.stringify(args),
      headers: {
        'Content-Type': 'application/json' } });


    const body = await res.json();
    return body;
  } };var _default =


semanticSearchAPI;exports.default = _default;