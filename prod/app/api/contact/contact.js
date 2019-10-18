"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mailer = _interopRequireDefault(require("../utils/mailer"));
var _settings = _interopRequireDefault(require("../settings/settings"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  async sendMessage({ email, name, message }) {
    const siteSettings = await _settings.default.get();
    const mailOptions = {
      from: '"Uwazi" <no-reply@uwazi.io',
      to: siteSettings.contactEmail,
      subject: `Contact mesage from ${name} ${email}`,
      text: message };


    return _mailer.default.send(mailOptions);
  } };exports.default = _default;