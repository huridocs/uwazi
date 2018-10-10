import errorLog from 'api/log/errorLog';
import { createError } from 'api/utils';

import handleError from '../handleError';

describe('handleError', () => {
  beforeEach(() => {
    spyOn(errorLog, 'error');
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
      expect(error).toEqual(createError('test error', 400));
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
  describe('when error is uncaught', () => {
    it('should append the info into the message', () => {
      const uncaught = true;
      const error = handleError({ message: 'error' }, { uncaught });
      expect(error.message).toBe('uncaught exception or unhandled rejection, Node process finished !!\n error');
    });
  });

  describe('when error is a response to client error', () => {
    it('use error instead of message', () => {
      const error = handleError({ json: { error: 'error' } });
      expect(error.message).toBe('error');
      expect(error.code).toBe(500);
    });
  });
});
