"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;const sanitizeResponse = response => {
  if (response.rows) {
    response.rows = response.rows.map(row => row.value);
  }

  return response;
};var _default =

sanitizeResponse;exports.default = _default;