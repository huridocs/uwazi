import { appContext } from 'api/utils/AppContext';
import middleware from '../error_handling_middleware.js';
import { errorLog } from '../../log';

describe('Error handling middleware', () => {
  let next;
  let res;
  let req = {};

  const contextRequestId = '1234';
  beforeEach(() => {
    req = {};
    next = jasmine.createSpy('next');
    res = { json: jasmine.createSpy('json'), status: jasmine.createSpy('status') };
    spyOn(errorLog, 'error'); //just to avoid annoying console output
    spyOn(appContext, 'get').and.returnValue(contextRequestId);
  });

  it('should respond with the error and error code as status', () => {
    const error = { message: 'error', code: 500 };
    middleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'error',
      prettyMessage: '\nerror',
      requestId: contextRequestId,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should log the url', () => {
    const error = { message: 'error', code: 500 };
    req.originalUrl = 'url';
    middleware(error, req, res, next);

    expect(errorLog.error).toHaveBeenCalledWith(
      `requestId: ${contextRequestId} \nurl: url\nerror`,
      {}
    );
  });

  it('should log the error body', () => {
    const error = { message: 'error', code: 500 };
    req.body = { param: 'value', param2: 'value2' };
    middleware(error, req, res, next);
    expect(errorLog.error).toHaveBeenCalledWith(
      `requestId: ${contextRequestId} \nbody: ${JSON.stringify(req.body, null, ' ')}\nerror`,
      {}
    );

    req.body = {};
    middleware(error, req, res, next);
    expect(errorLog.error).toHaveBeenCalledWith(`requestId: ${contextRequestId} \nerror`, {});
  });

  it('should log the error query', () => {
    const error = { message: 'error', code: 500 };
    req.query = { param: 'value', param2: 'value2' };
    middleware(error, req, res, next);

    expect(errorLog.error).toHaveBeenCalledWith(
      `requestId: ${contextRequestId} \nquery: ${JSON.stringify(req.query, null, ' ')}\nerror`,
      {}
    );
  });
});
