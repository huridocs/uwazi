import { storage } from 'api/files';
import date from 'api/utils/date';
import { tenants } from 'api/tenants';
import { Readable } from 'stream';
import activitylog from './activitylog';
import { NextFunction, Request, Response } from 'express';

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

function mustBeLogged(baseurl: string, method: string, body: { [k: string]: any }) {
  const isLoggedRequest =
    baseurl.includes('/api/') &&
    !ignoredMethods.includes(method) &&
    !IGNORED_ENDPOINTS.includes(baseurl);
  const validBody = !BODY_REQUIRED_ENDPOINTS.includes(baseurl) || JSON.stringify(body) !== '{}';
  return isLoggedRequest && validBody;
}

const createEntry = (req: Request, url: string) => {
  const { method, params, query, body, user = {} } = req;
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

export default (req: Request, _res: Response, next: NextFunction) => {
  const { url, method, body = {} } = req;
  const baseurl = url.split('?').shift() || '';
  if (mustBeLogged(baseurl, method, body)) {
    const entry = createEntry(req, baseurl);
    // eslint-disable-next-line no-void
    void activitylog.save(entry);
    // eslint-disable-next-line no-void
    void storage.storeFile(
      `${tenants.current().name}_${entry.time}_activity.log`,
      Readable.from([JSON.stringify(entry)]),
      'activitylog'
    );
  }
  next();
};
