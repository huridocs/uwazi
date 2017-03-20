import middleware from '../error_handling_middleware.js';

describe('Error handling middleware', function () {
  let next;
  let res;
  const req = {};

  beforeEach(() => {
    next = jasmine.createSpy('next');
    res = {json: jasmine.createSpy('json'), status: jasmine.createSpy('status')};
  });

  it('should call next', () => {
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  describe('when error is instanceof Error (unhandled)', () => {
    it('should respond the error stack trace splited', () => {
      middleware(req, res, next);
      const error = new Error('error');
      res.error(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({error: error.stack.split('\n')});
    });
  });

  describe('when error is uwazi error (handled object with message and code)', () => {
    it('should respond the error message with the status', () => {
      middleware(req, res, next);
      const error = {message: 'error', code: 'code'};
      res.error(error);
      expect(res.status).toHaveBeenCalledWith('code');
      expect(res.json).toHaveBeenCalledWith({error: 'error'});
    });
  });
});
