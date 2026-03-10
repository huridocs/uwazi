import authMiddleware from '../authMiddleware';

describe('authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { get: () => 'XMLHttpRequest' };
    res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return an error when there is no user in the request', () => {
    const middleWare = authMiddleware();
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error when the user role is not in the allowed roles', () => {
    const middleWare = authMiddleware(['root']);
    req.user = { role: 'newb' };
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when the user role is in the allowed roles', () => {
    const middleWare = authMiddleware(['editor']);
    req.user = { role: 'editor' };
    middleWare(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should have admin as the default roles list', () => {
    const middleWare = authMiddleware();
    req.user = { role: 'admin' };
    middleWare(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
