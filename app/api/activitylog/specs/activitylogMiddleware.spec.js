import activitylogMiddleware from '../activitylogMiddleware';
import activitylog from '../activitylog';

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

  it('should log api calls', () => {
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).toHaveBeenCalledWith({
      body: '{"title":"Hi"}',
      method: 'POST',
      params: '{"some":"params"}',
      query: '{"a":"query"}',
      time: 1,
      url: '/api/entities',
      user: 123,
      username: 'admin',
    });
  });

  it('should ignore NOT api calls', () => {
    req.url = '/entities';
    testActivityLogNotSaved();
  });

  it('should ignore all GET requests', () => {
    req.method = 'GET';
    testActivityLogNotSaved();
  });

  it('should ignore specific api calls', () => {
    const urls = [
      '/api/login',
      '/api/users',
      '/api/contact',
      '/api/unlockaccount',
      '/api/recoverpassword',
      '/api/resetpassword',
    ];

    urls.forEach(url => {
      req.url = url;
      testActivityLogNotSaved();
    });
  });
});
