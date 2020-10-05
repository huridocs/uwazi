import { appendFile } from 'api/files';
import { IGNORED_ENDPOINTS } from 'api/activitylog/activitylogMiddleware';
import activitylogMiddleware from '../activitylogMiddleware';
import activitylog from '../activitylog';

jest.mock('api/files', () => ({
  appendFile: jest.fn(),
  activityLogPath: jest.fn().mockImplementation(() => './log/default_activity.log'),
}));

describe('activitylogMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: 'POST',
      url: '/api/entities',
      query: { a: 'query' },
      body: { title: 'Hi' },
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

  const getOneYearAfterCurrentDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  };

  it('should log api calls', () => {
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).toHaveBeenCalledWith({
      body: '{"title":"Hi"}',
      expireAt: getOneYearAfterCurrentDate(),
      method: 'POST',
      params: '{"some":"params"}',
      query: '{"a":"query"}',
      time: 1,
      url: '/api/entities',
      user: 123,
      username: 'admin',
    });
  });

  it('should save the log entry on filesystem', () => {
    activitylogMiddleware(req, res, next);
    expect(appendFile).toHaveBeenCalledWith(
      './log/default_activity.log',
      JSON.stringify({
        url: '/api/entities',
        method: 'POST',
        params: '{"some":"params"}',
        query: '{"a":"query"}',
        body: '{"title":"Hi"}',
        user: 123,
        username: 'admin',
        time: 1,
        expireAt: getOneYearAfterCurrentDate(),
      })
    );
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
