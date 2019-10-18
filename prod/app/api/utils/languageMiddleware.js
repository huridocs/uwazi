"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _settings = _interopRequireDefault(require("../settings/settings"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

async (req, res, next) => {
  let lang = req.get('content-language');
  if (!lang && req.cookies) {
    lang = req.cookies.locale;
  }
  if (!lang && req.get('accept-language')) {
    [lang] = req.get('accept-language').split('-');
  }

  const { languages } = await _settings.default.get();

  const langExists = languages.find(l => l.key === lang);
  if (!langExists) {
    req.language = languages.find(l => l.default).key;
  }

  if (langExists) {
    req.language = lang;
  }

  next();
};exports.default = _default;