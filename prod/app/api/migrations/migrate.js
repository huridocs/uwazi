"use strict";var _connect_to_mongo = _interopRequireWildcard(require("../utils/connect_to_mongo.js"));
var _migrator = _interopRequireDefault(require("./migrator"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

(0, _connect_to_mongo.default)().
then(() => _migrator.default.migrate()).
then(_connect_to_mongo.disconnect);