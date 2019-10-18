"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;const { PORT } = process.env;var _default =
{
  production: PORT || 3000,
  development: PORT || 3000,
  demo: PORT || 4000 };exports.default = _default;