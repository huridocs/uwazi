"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;const geolocation = async (entityToImport, templateProperty) => {
  const [lat, lon] = entityToImport[templateProperty.name].split('|');
  if (lat && lon) {
    return [{ lat, lon }];
  }

  return null;
};var _default =

geolocation;exports.default = _default;