"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;var _settings = _interopRequireDefault(require("../settings"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const allowedRoutes = ['login', 'setpassword/', 'unlockaccount/'];
const allowedRoutesMatch = new RegExp(allowedRoutes.join('|'));

const allowedApiCalls = ['/api/recoverpassword', '/api/resetpassword', '/api/unlockaccount', '/api/public'];
const allowedApiMatch = new RegExp(allowedApiCalls.join('|'));

const forbiddenRoutes = ['/api/', '/uploaded_documents/'];
const forbiddenRoutesMatch = new RegExp(forbiddenRoutes.join('|'));

function _default(req, res, next) {
  if (req.user || req.url.match(allowedRoutesMatch)) {
    return next();
  }

  return _settings.default.get().
  then(result => {
    if (result.private && !req.url.match(allowedApiMatch)) {
      if (req.url.match(forbiddenRoutesMatch)) {
        res.status(401);
        res.json({ error: 'Unauthorized' });
        return;
      }

      res.redirect('/login');
      return;
    }

    next();
  });
}