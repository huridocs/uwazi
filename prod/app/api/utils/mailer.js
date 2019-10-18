"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _nodemailer = _interopRequireDefault(require("nodemailer"));
var _mailer = _interopRequireDefault(require("../config/mailer"));
var _settings = _interopRequireDefault(require("../settings/settings"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let transporterOptions = {
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
  secure: false,
  tls: {
    rejectUnauthorized: false } };



if (Object.keys(_mailer.default).length) {
  transporterOptions = _mailer.default;
}var _default =

{
  send(mailOptions) {
    let transporter;
    return new Promise((resolve, reject) => {
      _settings.default.get().
      then(config => {
        try {
          transporter = _nodemailer.default.createTransport(config.mailerConfig ? JSON.parse(config.mailerConfig) : transporterOptions);
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(info);
          });
        } catch (err) {
          reject(err);
        }
      }).
      catch(reject);
    });
  } };exports.default = _default;