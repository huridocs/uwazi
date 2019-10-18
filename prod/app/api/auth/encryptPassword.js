"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.comparePasswords = exports.default = void 0;var _bcrypt = _interopRequireDefault(require("bcrypt"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const saltRounds = 10;

const encryptPassowrd = async plainPassword => _bcrypt.default.hash(plainPassword, saltRounds);
const comparePasswords = async (plain, hashed) => _bcrypt.default.compare(plain, hashed);exports.comparePasswords = comparePasswords;var _default =

encryptPassowrd;exports.default = _default;