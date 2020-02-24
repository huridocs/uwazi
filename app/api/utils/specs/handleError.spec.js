import errorLog from 'api/log/errorLog';
import { createError } from 'api/utils';
import debugLog from 'api/log/debugLog';

import handleError from '../handleError';

describe('handleError', () => {
  beforeEach(() => {
    spyOn(errorLog, 'error');
    spyOn(debugLog, 'debug');
  });

  describe('when error is instance of Error', () => {
    it('should return the error with 500 code', () => {
      const errorInstance = new Error('error');
      const error = handleError(errorInstance);

      expect(error.code).toBe(500);
      expect(error.message).toEqual(errorInstance.stack);
    });
    it('should log the error', () => {
      const error = new Error('error');
      handleError(error);

      expect(errorLog.error).toHaveBeenCalledWith(`\n${error.stack}`);
    });
  });

  describe('when error is created with createError', () => {
    it('should return the error', () => {
      const error = handleError(createError('test error', 400));
      expect(error).toMatchSnapshot();
    });
    it('should not log the error when code is not 500', () => {
      handleError(createError('test error', 400));
      expect(errorLog.error).not.toHaveBeenCalled();

      handleError(createError('test error'));
      expect(errorLog.error).toHaveBeenCalledWith('\ntest error');
    });
  });
  describe('when error is a MongoError', () => {
    it('should return the error with a 500 code', () => {
      const error = handleError({ name: 'MongoError', message: 'error', code: '345' });
      expect(error.code).toBe(500);
      expect(error.message).toBe('error');
    });
  });
  describe('when error is a mongoose ValidationError', () => {
    it('should return the error with a 422 error', () => {
      const error = handleError({ name: 'ValidationError', message: 'error', code: '1000' });
      expect(error.code).toBe(422);
      expect(error.message).toBe('error');
    });
  });
  describe('when error is undefined', () => {
    it('should return generate a new error with code 500', () => {
      const error = handleError();
      expect(error.code).toBe(500);
      expect(error.message).toMatch(/undefined error/i);
    });
  });
  describe('when error is uncaught', () => {
    it('should append the info into the message', () => {
      const uncaught = true;
      const error = handleError({ message: 'error' }, { uncaught });
      expect(error.message).toBe(
        'uncaught exception or unhandled rejection, Node process finished !!\n error'
      );
    });
  });

  describe('when error is a response to client error', () => {
    it('should ignore it', () => {
      const error = handleError({ json: { error: 'error' } });
      expect(error).toBe(false);
      expect(errorLog.error).not.toHaveBeenCalled();
      expect(debugLog.debug).not.toHaveBeenCalled();
    });
  });

  describe('when "Cast to objectId failed"', () => {
    it('should set code to 400', () => {
      const error = handleError({ message: 'Cast to ObjectId failed for value' });
      expect(error.code).toBe(400);
    });
  });

  describe('when "rison decoder error"', () => {
    it('should set code to 400', () => {
      const error = handleError({ message: 'rison decoder error' });
      expect(error.code).toBe(400);
    });
  });

  describe('when error is 400', () => {
    it('should log it using debugLog', () => {
      handleError(createError('test error', 400));
      expect(debugLog.debug).toHaveBeenCalledWith('\ntest error');
    });
  });

  describe('when the body contains the user and password', () => {
    it('should not show them in the log', () => {
      handleError(createError('test error', 400), {
        req: { body: { username: 'admin', password: '1234' } },
      });
      expect(debugLog.debug.calls.allArgs()).toMatchSnapshot();
    });
  });
});
