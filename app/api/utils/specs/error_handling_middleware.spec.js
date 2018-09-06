import middleware from '../error_handling_middleware.js';
import errorLog from '../../log/errorLog';

describe('Error handling middleware', () => {
  let next;
  let res;
  const req = {};

  beforeEach(() => {
    next = jasmine.createSpy('next');
    res = { json: jasmine.createSpy('json'), status: jasmine.createSpy('status') };
    spyOn(errorLog, 'error'); //just to avoid annoying console output
  });

  it('should respond with the error and error code as status', () => {
    const error = { message: 'error', code: 500 };
    middleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error' });
    expect(next).toHaveBeenCalled();
  });
});
