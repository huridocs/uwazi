"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.objectPath = void 0;const objectPath = (path, object) => path.split('.').reduce((o, key) => {
  if (!o || !key) {
    return o;
  }
  return o.toJS ? o.get(key) : o[key];
}, object);exports.objectPath = objectPath;