import activitylogMiddleware from '../activitylogMiddleware';
import activitylog from '../activitylog';

describe('activitylogMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { method: 'POST', url: '/api/entities', query: {}, body: { title: 'Hi' }, user: { _id: 123, username: 'admin' }, params: {} };
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json')
    };
    next = jasmine.createSpy('next');
    spyOn(activitylog, 'save');
    spyOn(Date, 'now').and.returnValue(422647908000);
  });

  it('should log api calls', () => {
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).toHaveBeenCalledWith({
      body: '{"title":"Hi"}',
      method: 'POST',
      params: '{}',
      query: '{}',
      time: 422647908000,
      url: '/api/entities',
      user: 123,
      username: 'admin'
    });
  });

  it('should ignore NOT api calls', () => {
    req.url = '/entities';
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).not.toHaveBeenCalled();
  });

  it('should ignore specific api calls', () => {
    req.url = '/api/login';
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).not.toHaveBeenCalled();

    req.url = '/api/users';
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).not.toHaveBeenCalled();

    req.url = '/api/activitylog';
    req.method = 'GET';
    activitylogMiddleware(req, res, next);
    expect(activitylog.save).not.toHaveBeenCalled();
  });
});
