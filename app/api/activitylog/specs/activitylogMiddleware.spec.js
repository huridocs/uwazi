import { IGNORED_ENDPOINTS } from 'api/activitylog/activitylogMiddleware';
import { deleteFile, storage } from 'api/files';
import { tenants } from 'api/tenants';
import date from 'api/utils/date';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { legacyLogger } from 'api/log';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import waitForExpect from 'wait-for-expect';
import activitylog from '../activitylog';
import activitylogMiddleware from '../activitylogMiddleware';

describe('activitylogMiddleware', () => {
  let req;
  let res;
  let next;

  beforeAll(() => {
    testingEnvironment.setTenant();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    req = {
      method: 'POST',
      url: '/api/entities',
      query: { a: 'query' },
      body: { title: 'Hi', password: '12345' },
      user: { _id: 123, username: 'admin' },
      params: { some: 'params' },
    };

    res = {
      status: jest.fn(),
      json: jest.fn(),
    };

    next = jest.fn();
    jest.spyOn(activitylog, 'save').mockImplementation(async () => Promise.resolve());
    jest.spyOn(Date, 'now').mockReturnValue(1);
  });

  function testActivityLogNotSaved() {
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).not.toHaveBeenCalled();
  }

  it('should log api calls', () => {
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).toHaveBeenCalledWith({
      body: '{"title":"Hi","password":"*****"}',
      expireAt: date.addYearsToCurrentDate(1),
      method: 'POST',
      params: '{"some":"params"}',
      query: '{"a":"query"}',
      time: 1,
      url: '/api/entities',
      user: 123,
      username: 'admin',
    });
  });

  it('should log api when user is deleted', () => {
    req.url = '/api/users';
    req.method = 'DELETE';
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).toHaveBeenCalledWith({
      body: '{"title":"Hi","password":"*****"}',
      expireAt: date.addYearsToCurrentDate(1),
      method: 'DELETE',
      params: '{"some":"params"}',
      query: '{"a":"query"}',
      time: 1,
      url: '/api/users',
      user: 123,
      username: 'admin',
    });
  });

  it('should save the log entry on filesystem', async () => {
    await deleteFile(
      `${tenants.current().activityLogs}/${tenants.current().name}_1000_activity.log`
    );

    jest.spyOn(Date, 'now').mockImplementationOnce(() => 1000);

    activitylogMiddleware(req, res, next);
    await waitForExpect(async () => {
      const file = await fs.readFile(
        `${tenants.current().activityLogs}/${tenants.current().name}_1000_activity.log`
      );

      const fileContents = JSON.parse(file.toString());
      expect(fileContents).toEqual({
        body: '{"title":"Hi","password":"*****"}',
        expireAt: expect.any(String),
        method: 'POST',
        params: '{"some":"params"}',
        query: '{"a":"query"}',
        time: 1000,
        url: '/api/entities',
        user: 123,
        username: 'admin',
      });
    });
  });

  it('should catch errors when saving log entry on db', async () => {
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => ({}));
    jest
      .spyOn(activitylog, 'save')
      .mockImplementation(async () => Promise.reject(new Error('activitylog save error')));

    activitylogMiddleware(req, res, next);
    await waitForExpect(() => {
      expect(legacyLogger.error).toHaveBeenCalled();
      expect(legacyLogger.error.mock.calls[0][0]).toMatch('activitylog save error');
    });
  });

  it('should catch errors when saving log entry on filesystem', async () => {
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => ({}));
    jest
      .spyOn(storage, 'storeFile')
      .mockImplementation(async () => Promise.reject(new Error('storage save error')));

    activitylogMiddleware(req, res, next);
    await waitForExpect(() => {
      expect(legacyLogger.error).toHaveBeenCalled();
      expect(legacyLogger.error.mock.calls[0][0]).toMatch('storage save error');
    });
  });

  describe('non registered entries', () => {
    it('should ignore NOT api calls', () => {
      req.url = '/entities';
      testActivityLogNotSaved();
    });

    it.each(['GET', 'OPTIONS', 'HEAD'])('should ignore not desired method %s', method => {
      req.method = method;
      testActivityLogNotSaved();
    });

    it.each(IGNORED_ENDPOINTS)('should ignore calls to %s', endpoint => {
      req.url = endpoint;
      testActivityLogNotSaved();
    });

    it('should not log multipart post with no body', () => {
      req.url = '/api/files/upload/document';
      req.body = {};
      testActivityLogNotSaved();
    });
  });
});
