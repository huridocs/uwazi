"use strict";var _authMiddleware = _interopRequireDefault(require("../authMiddleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { get: () => 'XMLHttpRequest' };
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json') };

    next = jasmine.createSpy('next');
  });

  it('should return an error when there is no user in the request', () => {
    const middleWare = (0, _authMiddleware.default)();
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error when the user role is not in the allowed roles', () => {
    const middleWare = (0, _authMiddleware.default)(['root']);
    req.user = { role: 'newb' };
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error when logged in but no X-Requested-With header', () => {
    req = { get: () => '' };

    const middleWare = (0, _authMiddleware.default)(['editor']);
    req.user = { role: 'editor' };
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when the user role is in the allowed roles', () => {
    const middleWare = (0, _authMiddleware.default)(['editor']);
    req.user = { role: 'editor' };
    middleWare(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should have admin as the default roles list', () => {
    const middleWare = (0, _authMiddleware.default)();
    req.user = { role: 'admin' };
    middleWare(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});