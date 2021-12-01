import { fs, activityLogPath } from 'api/files';
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

const createEntry = req => {
  const { url, method, params, query, body, user = {} } = req;
  const expireAt = date.addYearsToCurrentDate(1);
  const bodyLog = { ...body };
  if (bodyLog.password) bodyLog.password = '*****';
  return {
    url,
    method,
    params: JSON.stringify(params),
    query: JSON.stringify(query),
    body: JSON.stringify(bodyLog),
    user: user._id,
    username: user.username,
    time: Date.now(),
    expireAt,
  };
};

export default (req, _res, next) => {
  try {
    const { url, method, body = {} } = req;
    const baseurl = url.split('?').shift();
    if (mustBeLogged(baseurl, method, body)) {
      const entry = createEntry({ ...req, url: baseurl });
      activitylog.save(entry);
      fs.appendFile(
        activityLogPath(`${tenants.current().name}_activity.log`),
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
