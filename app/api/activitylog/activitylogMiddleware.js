import { activityLogPath, appendFile } from 'api/files';
import date from 'api/utils/date';
import createError from 'api/utils/Error';
import { tenants } from 'api/tenants';
import activitylog from './activitylog';

const ignoredMethods = ['GET', 'OPTIONS', 'HEAD'];
export const IGNORED_ENDPOINTS = [
  '/api/login',
  '/api/contact',
  '/api/unlockaccount',
  '/api/resetpassword',
  '/api/recoverpassword',
  '/api/documents/pdfInfo',
  '/api/documents/download',
  '/api/attachments/download',
  '/api/semantic-search/notify-updates',
  '/api/sync',
  '/api/sync/upload',
];
export const BODY_REQUIRED_ENDPOINTS = [
  '/api/files/upload/document',
  '/api/files/upload/custom',
  '/api/attachments/upload',
  '/api/public',
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
  try {
    const baseurl = req.url.split('?').shift();
    if (mustBeLogged(baseurl, req.method, req.body)) {
      const bodyLog = { ...req.body };
      if (bodyLog.password) bodyLog.password = '*****';
      const entry = {
        url: baseurl,
        method: req.method,
        params: JSON.stringify(req.params),
        query: JSON.stringify(req.query),
        body: JSON.stringify(bodyLog),
        user: req.user._id,
        username: req.user.username,
        time: Date.now(),
        expireAt: date.addYearsToCurrentDate(1),
      };
      activitylog.save(entry);
      appendFile(
        activityLogPath(`${tenants.current().name}$_activity.log`),
        `${JSON.stringify(entry)}\r\n`
      );
    }
    next();
  } catch (e) {
    //this is due to Jest returning false for ==> e instanceof Error
    //https://github.com/facebook/jest/issues/11808
    next(createError(e.message));
  }
};
