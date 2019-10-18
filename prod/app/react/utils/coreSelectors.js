"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reselect = require("reselect");var _default =

{
  selectTemplates: (0, _reselect.createSelector)(s => s.templates, t => t.toJS()) };exports.default = _default;