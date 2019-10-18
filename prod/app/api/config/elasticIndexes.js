"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;const { INDEX_NAME } = process.env;var _default =

{
  production: INDEX_NAME || 'uwazi_development',
  testing: INDEX_NAME || 'testing',
  development: INDEX_NAME || 'uwazi_development',
  demo: INDEX_NAME || 'uwazi_demo' };exports.default = _default;