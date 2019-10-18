"use strict";var _error_handling_middleware = _interopRequireDefault(require("../error_handling_middleware.js"));
var _errorLog = _interopRequireDefault(require("../../log/errorLog"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Error handling middleware', () => {
  let next;
  let res;
  let req = {};

  beforeEach(() => {
    req = {};
    next = jasmine.createSpy('next');
    res = { json: jasmine.createSpy('json'), status: jasmine.createSpy('status') };
    spyOn(_errorLog.default, 'error'); //just to avoid annoying console output
  });

  it('should respond with the error and error code as status', () => {
    const error = { message: 'error', code: 500 };
    (0, _error_handling_middleware.default)(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error', prettyMessage: '\nerror' });
    expect(next).toHaveBeenCalled();
  });

  it('should log the url', () => {
    const error = { message: 'error', code: 500 };
    req.originalUrl = 'url';
    (0, _error_handling_middleware.default)(error, req, res, next);

    expect(_errorLog.default.error).toHaveBeenCalledWith('\nurl: url\nerror');
  });

  it('should log the error body', () => {
    const error = { message: 'error', code: 500 };
    req.body = { param: 'value', param2: 'value2' };
    (0, _error_handling_middleware.default)(error, req, res, next);
    expect(_errorLog.default.error).toHaveBeenCalledWith(`\nbody: ${JSON.stringify(req.body, null, ' ')}\nerror`);

    req.body = {};
    (0, _error_handling_middleware.default)(error, req, res, next);
    expect(_errorLog.default.error).toHaveBeenCalledWith('\nerror');
  });

  it('should log the error query', () => {
    const error = { message: 'error', code: 500 };
    req.query = { param: 'value', param2: 'value2' };
    (0, _error_handling_middleware.default)(error, req, res, next);

    expect(_errorLog.default.error).toHaveBeenCalledWith(`\nquery: ${JSON.stringify(req.query, null, ' ')}\nerror`);
  });
});