"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _activitylog = _interopRequireDefault(require("./activitylog"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const ignorelist = [
'POST/api/users',
'POST/api/login'];var _default =


(req, res, next) => {
  const { url, method, params, query, body, user = {} } = req;
  const baseurl = url.split('?').shift();

  if (method !== 'GET' && !ignorelist.includes(method + baseurl) && baseurl.includes('/api/')) {
    const time = Date.now();
    const entry = {
      url: baseurl,
      method,
      params: JSON.stringify(params),
      query: JSON.stringify(query),
      body: JSON.stringify(body),
      user: user._id,
      username: user.username,
      time };

    _activitylog.default.save(entry);
  }
  next();
};exports.default = _default;