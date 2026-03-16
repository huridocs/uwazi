import { appContext } from '#api/utils/AppContext.js';
import middleware from '../error_handling_middleware.js';
import { legacyLogger } from '../../log.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';

describe('Error handling middleware', () => {
  let next;
  let res;
  let req = {};
  let mockLogger;

  const contextRequestId = '1234';
  beforeEach(() => {
    req = {};
    next = jest.fn();
    res = { json: jest.fn(), status: jest.fn(), headersSent: false };
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warning: jest.fn(),
      critical: jest.fn(),
    };
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    jest.spyOn(appContext, 'get').mockReturnValue(contextRequestId);
    jest.spyOn(LoggerFactory, 'default').mockReturnValue(mockLogger);
  });

  it('should respond with the error and error code as status', () => {
    const error = { message: 'error', code: 500 };
    middleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'A server side error has occurred',
        logLevel: 'error',
        prettyMessage: 'A server side error has occurred',
        requestId: contextRequestId,
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should log the url', () => {
    const error = { message: 'error', code: 500 };
    req.originalUrl = 'url';
    middleware(error, req, res, next);

    expect(legacyLogger.error).toHaveBeenCalledWith(
      `requestId: ${contextRequestId} \nurl: url\nerror`,
      {}
    );
  });

  it('should log the error body', () => {
    const error = { message: 'error', code: 500 };
    req.body = { param: 'value', param2: 'value2' };
    middleware(error, req, res, next);
    expect(legacyLogger.error).toHaveBeenCalledWith(
      `requestId: ${contextRequestId} \nbody: ${JSON.stringify(req.body, null, ' ')}\nerror`,
      {}
    );

    req.body = {};
    middleware(error, req, res, next);
    expect(legacyLogger.error).toHaveBeenCalledWith(`requestId: ${contextRequestId} \nerror`, {});
  });

  it('should log the error query', () => {
    const error = { message: 'error', code: 500 };
    req.query = { param: 'value', param2: 'value2' };
    middleware(error, req, res, next);

    expect(legacyLogger.error).toHaveBeenCalledWith(
      `requestId: ${contextRequestId} \nquery: ${JSON.stringify(req.query, null, ' ')}\nerror`,
      {}
    );
    expect(next).not.toHaveBeenCalled();
  });

  describe('when headers are already sent', () => {
    it('should log comprehensive diagnostic information', () => {
      const error = {
        message: 'Cannot set headers after they are sent to the client',
        code: 'ERR_HTTP_HEADERS_SENT',
        name: 'Error',
        stack: 'Error: Cannot set headers...\n    at ...',
      };
      req = {
        url: '/en/library',
        method: 'GET',
        route: { path: '/en/:locale' },
        user: { _id: 'user123', role: 'admin' },
        aborted: false,
        headers: { 'user-agent': 'test' },
        query: { q: 'search' },
      };
      res.headersSent = true;
      res.statusCode = 200;

      middleware(error, req, res, next);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Headers already sent when error middleware called',
        {
          namespace: 'Error_Middleware',
          url: '/en/library',
          method: 'GET',
          routePath: '/en/:locale',
          aborted: false,
          statusCodeSent: 200,
          errorMessage: 'Cannot set headers after they are sent to the client',
          errorCode: 'ERR_HTTP_HEADERS_SENT',
          errorName: 'Error',
          errorStack: 'Error: Cannot set headers...\n    at ...',
          query: JSON.stringify({ q: 'search' }),
          notify: true,
        }
      );
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should pass error to next when headers already sent', () => {
      const error = { message: 'error', code: 500 };
      res.headersSent = true;

      middleware(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('when error is ClientAbortedRequestError', () => {
    it('should not send response for ClientAbortedRequestError and delegate to next', () => {
      const error = new ClientAbortedRequestError('Client aborted the request');
      req = {
        url: '/api/files/download/somefile.pdf',
        method: 'GET',
        route: { path: '/api/files/download/:filename' },
      };

      middleware(error, req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should NOT log when ClientAbortedRequestError occurs with headers already sent', () => {
      const error = new ClientAbortedRequestError('Client aborted the request');
      error.code = 'ERR_STREAM_PREMATURE_CLOSE';
      req = {
        url: '/api/files/download/somefile.pdf',
        method: 'GET',
        route: { path: '/api/files/download/:filename' },
        aborted: true,
        query: {},
      };
      res.headersSent = true;
      res.statusCode = 200;

      middleware(error, req, res, next);

      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
