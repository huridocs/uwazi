import { activityLogPath, appendFile } from 'api/files';
import activitylog from './activitylog';

const ignoredMethods = ['GET', 'OPTIONS', 'HEAD'];
export const IGNORED_ENDPOINTS = [
  '/api/users',
  '/api/login',
  '/api/contact',
  '/api/unlockaccount',
  '/api/resetpassword',
  '/api/recoverpassword',
  '/api/documents/pdfInfo',
  '/api/documents/download',
  '/api/attachments/download',
  '/api/semantic-search/notify-updates',
];
export const BODY_REQUIRED_ENDPOINTS = [
  '/api/files/upload/document',
  '/api/files/upload/custom',
  '/api/attachments/upload',
];

function mustBeLogged(baseurl, method, body) {
  const isLoggedRequest =
    baseurl.includes('/api/') &&
    !ignoredMethods.includes(method) &&
    !IGNORED_ENDPOINTS.includes(baseurl);
  const validBody = !BODY_REQUIRED_ENDPOINTS.includes(baseurl) || JSON.stringify(body) !== '{}';
  return isLoggedRequest && validBody;
}

export default (req, _res, next) => {
  const { url, method, params, query, body, user = {} } = req;
  const baseurl = url.split('?').shift();
  if (mustBeLogged(baseurl, method, body)) {
    const time = Date.now();
    const entry = {
      url: baseurl,
      method,
      params: JSON.stringify(params),
      query: JSON.stringify(query),
      body: JSON.stringify(body),
      user: user._id,
      username: user.username,
      time,
    };
    activitylog.save(entry);
    appendFile(activityLogPath(), JSON.stringify(entry));
  }
  next();
};
