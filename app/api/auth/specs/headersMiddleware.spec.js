import headersMiddleware from '../headersMiddleware';

describe('headersMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { get: () => 'XMLHttpRequest' };
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json'),
    };
    next = jasmine.createSpy('next');
  });

  it('should return an error when no X-Requested-With header in POST', () => {
    req = { get: () => '', method: 'POST' };

    headersMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'X-Requested-With header was not found!',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should not return an error when no X-Requested-With header in GET', () => {
    req = { get: () => '', method: 'GET' };

    headersMiddleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
