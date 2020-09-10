import { NextFunction, Response, Request } from 'express';
import { errorLog } from 'api/log/errorLog';
import { errorHandlingMiddleware } from '../errorHandlingMiddleware';

describe('Error handling middleware', () => {
  let next: NextFunction;
  let res: Response;
  let req: Request = <Request>{};

  beforeEach(() => {
    req = <Request>{};
    next = jasmine.createSpy('next');
    res = ({
      json: jasmine.createSpy('json'),
      status: jasmine.createSpy('status'),
    } as unknown) as Response;
    spyOn(errorLog, 'error'); //just to avoid annoying console output
  });

  it('should respond with the error and error code as status', () => {
    const error = { message: 'error', code: 500 };
    errorHandlingMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error', prettyMessage: '\nerror' });
    expect(next).toHaveBeenCalled();
  });

  it('should log the url', () => {
    const error = { message: 'error', code: 500 };
    req.originalUrl = 'url';
    errorHandlingMiddleware(error, req, res, next);

    expect(errorLog.error).toHaveBeenCalledWith('\nurl: url\nerror');
  });

  it('should log the error body', () => {
    const error = { message: 'error', code: 500 };
    req.body = { param: 'value', param2: 'value2' };
    errorHandlingMiddleware(error, req, res, next);
    expect(errorLog.error).toHaveBeenCalledWith(
      `\nbody: ${JSON.stringify(req.body, null, ' ')}\nerror`
    );

    req.body = {};
    errorHandlingMiddleware(error, req, res, next);
    expect(errorLog.error).toHaveBeenCalledWith('\nerror');
  });

  it('should log the error query', () => {
    const error = { message: 'error', code: 500 };
    req.query = { param: 'value', param2: 'value2' };
    errorHandlingMiddleware(error, req, res, next);

    expect(errorLog.error).toHaveBeenCalledWith(
      `\nquery: ${JSON.stringify(req.query, null, ' ')}\nerror`
    );
  });
});
