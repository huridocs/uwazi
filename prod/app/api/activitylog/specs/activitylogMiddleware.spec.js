"use strict";var _activitylogMiddleware = _interopRequireDefault(require("../activitylogMiddleware"));
var _activitylog = _interopRequireDefault(require("../activitylog"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

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
      params: { some: 'params' } };


    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json') };


    next = jasmine.createSpy('next');
    spyOn(_activitylog.default, 'save');
    spyOn(Date, 'now').and.returnValue(1);
  });

  it('should log api calls', () => {
    (0, _activitylogMiddleware.default)(req, res, next);
    expect(_activitylog.default.save).toHaveBeenCalledWith({
      body: '{"title":"Hi"}',
      method: 'POST',
      params: '{"some":"params"}',
      query: '{"a":"query"}',
      time: 1,
      url: '/api/entities',
      user: 123,
      username: 'admin' });

  });

  it('should ignore NOT api calls', () => {
    req.url = '/entities';
    (0, _activitylogMiddleware.default)(req, res, next);
    expect(_activitylog.default.save).not.toHaveBeenCalled();
  });

  it('should ignore all GET requests', () => {
    req.method = 'GET';
    (0, _activitylogMiddleware.default)(req, res, next);
    expect(_activitylog.default.save).not.toHaveBeenCalled();
  });

  it('should ignore specific api calls', () => {
    req.url = '/api/login';
    (0, _activitylogMiddleware.default)(req, res, next);
    expect(_activitylog.default.save).not.toHaveBeenCalled();

    req.url = '/api/users';
    (0, _activitylogMiddleware.default)(req, res, next);
    expect(_activitylog.default.save).not.toHaveBeenCalled();
  });
});