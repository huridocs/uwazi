import { IGNORED_ENDPOINTS } from 'api/activitylog/activitylogMiddleware';
import { tenants } from 'api/tenants';
import date from 'api/utils/date';
import { deleteFile } from 'api/files';
import { testingEnvironment } from 'api/utils/testingEnvironment';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import waitForExpect from 'wait-for-expect';
import activitylogMiddleware from '../activitylogMiddleware';
import activitylog from '../activitylog';

describe('activitylogMiddleware', () => {
  let req;
  let res;
  let next;

  beforeAll(() => {
    testingEnvironment.setTenant();
  });

  beforeEach(() => {
    req = {
      method: 'POST',
      url: '/api/entities',
      query: { a: 'query' },
      body: { title: 'Hi', password: '12345' },
      user: { _id: 123, username: 'admin' },
      params: { some: 'params' },
    };

    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json'),
    };

    next = jasmine.createSpy('next');
    spyOn(activitylog, 'save');
    spyOn(Date, 'now').and.returnValue(1);
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
    await deleteFile(`${tenants.current().activityLogs}/${tenants.current().name}_activity.log`);

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
