"use strict";var _errorLog = _interopRequireDefault(require("../../log/errorLog"));
var _ = require("./..");
var _debugLog = _interopRequireDefault(require("../../log/debugLog"));

var _handleError = _interopRequireDefault(require("../handleError"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('handleError', () => {
  beforeEach(() => {
    spyOn(_errorLog.default, 'error');
    spyOn(_debugLog.default, 'debug');
  });

  describe('when error is instance of Error', () => {
    it('should return the error with 500 code', () => {
      const errorInstance = new Error('error');
      const error = (0, _handleError.default)(errorInstance);

      expect(error.code).toBe(500);
      expect(error.message).toEqual(errorInstance.stack);
    });
    it('should log the error', () => {
      const error = new Error('error');
      (0, _handleError.default)(error);

      expect(_errorLog.default.error).toHaveBeenCalledWith(`\n${error.stack}`);
    });
  });

  describe('when error is created with createError', () => {
    it('should return the error', () => {
      const error = (0, _handleError.default)((0, _.createError)('test error', 400));
      expect(error).toMatchSnapshot();
    });
    it('should not log the error when code is not 500', () => {
      (0, _handleError.default)((0, _.createError)('test error', 400));
      expect(_errorLog.default.error).not.toHaveBeenCalled();

      (0, _handleError.default)((0, _.createError)('test error'));
      expect(_errorLog.default.error).toHaveBeenCalledWith('\ntest error');
    });
  });
  describe('when error is a MongoError', () => {
    it('should return the error with a 500 code', () => {
      const error = (0, _handleError.default)({ name: 'MongoError', message: 'error', code: '345' });
      expect(error.code).toBe(500);
      expect(error.message).toBe('error');
    });
  });
  describe('when error is uncaught', () => {
    it('should append the info into the message', () => {
      const uncaught = true;
      const error = (0, _handleError.default)({ message: 'error' }, { uncaught });
      expect(error.message).toBe('uncaught exception or unhandled rejection, Node process finished !!\n error');
    });
  });

  describe('when error is a response to client error', () => {
    it('should ignore it', () => {
      const error = (0, _handleError.default)({ json: { error: 'error' } });
      expect(error).toBe(false);
      expect(_errorLog.default.error).not.toHaveBeenCalled();
      expect(_debugLog.default.debug).not.toHaveBeenCalled();
    });
  });

  describe('when "Cast to objectId failed"', () => {
    it('should set code to 400', () => {
      const error = (0, _handleError.default)({ message: 'Cast to ObjectId failed for value' });
      expect(error.code).toBe(400);
    });
  });

  describe('when "rison decoder error"', () => {
    it('should set code to 400', () => {
      const error = (0, _handleError.default)({ message: 'rison decoder error' });
      expect(error.code).toBe(400);
    });
  });

  describe('when error is 400', () => {
    it('should log it using debugLog', () => {
      (0, _handleError.default)((0, _.createError)('test error', 400));
      expect(_debugLog.default.debug).toHaveBeenCalledWith('\ntest error');
    });
  });

  describe('when the body contains the user and password', () => {
    it('should not show them in the log', () => {
      (0, _handleError.default)((0, _.createError)('test error', 400), { req: { body: { username: 'admin', password: '1234' } } });
      expect(_debugLog.default.debug.calls.allArgs()).toMatchSnapshot();
    });
  });
});