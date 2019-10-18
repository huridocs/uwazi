"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _franc = _interopRequireDefault(require("franc"));
var _languagesList = _interopRequireWildcard(require("./languagesList"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get: _languagesList.default,
  data: Object.keys(_languagesList.languages).map(k => _languagesList.languages[k]),
  getAll: (purpose = 'elastic') => {
    const unique = (v, i, a) => a.indexOf(v) === i;
    const notNull = v => Boolean(v);
    return Object.keys(_languagesList.languages).
    map(k => _languagesList.languages[k][purpose]).
    filter(unique).
    filter(notNull);
  },

  detect: (text, purpose = 'elastic') => (0, _languagesList.default)((0, _franc.default)(text), purpose) };exports.default = _default;