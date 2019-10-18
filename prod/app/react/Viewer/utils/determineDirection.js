"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _languagesList = _interopRequireWildcard(require("../../../shared/languagesList"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var _default =



({ language }) => {
  const languageKey = (0, _languagesList.default)(language, 'ISO639_1');
  const laguageData = _languagesList.allLanguages.find(l => l.key === languageKey) || {};
  return `force-${laguageData.rtl ? 'rtl' : 'ltr'}`;
};exports.default = _default;