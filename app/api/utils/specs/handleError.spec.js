import { legacyLogger } from 'api/log';
import { createError } from 'api/utils';

import { errors as elasticErrors } from '@elastic/elasticsearch';
import { S3TimeoutError } from 'api/files/S3Storage';
import { appContext } from 'api/utils/AppContext';
import util from 'node:util';
import { handleError, prettifyError } from '../handleError';

const contextRequestId = '1234';

const { ConnectionError } = elasticErrors;

describe('handleError', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    jest.spyOn(legacyLogger, 'debug').mockImplementation(() => {});
    jest.spyOn(appContext, 'get').mockReturnValue(contextRequestId);
  });

  describe('errors by type', () => {
    describe('and is instance of S3TimeoutError', () => {
      it('should be a debug logLevel and a 408 http code', () => {
        const errorInstance = new S3TimeoutError(new Error('timeout'));
        const error = handleError(errorInstance);
        expect(error).toMatchObject({
          code: 408,
          logLevel: 'debug',
        });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('timeout');
      });
    });
    describe('when error is instance of Error', () => {
      it('should return the error with 500 code without the original error and error stack', () => {
        const errorInstance = new Error('error');

        const error = handleError(errorInstance);

        expect(error.code).toBe(500);
        expect(error.requestId).toBe(contextRequestId);
        expect(error.prettyMessage).toEqual('error');
        expect(error.message).toBeUndefined();
        expect(error.original).toBeUndefined();
      });

      it('should correctly log the original error for ElasticSearch exceptions', () => {
        const error = new ConnectionError('test error', { meta: 'some meta' });
        handleError(error);

        expect(legacyLogger.error).toHaveBeenCalledWith(
          `requestId: ${contextRequestId} \n${util.inspect(error)}
original error: {
 "name": "ConnectionError",
 "meta": {
  "meta": "some meta"
 }
}`,
          {}
        );
      });

      it('should log the error with the requestId', () => {
        const error = new Error('error');
        handleError(error);

        expect(legacyLogger.error).toHaveBeenCalledWith(
          `requestId: ${contextRequestId} \n${error.stack}\noriginal error: {}`,
          {}
        );
      });
    });

    describe('when error is created with createError', () => {
      it('should return the error', () => {
        const error = handleError(createError('test error', 400));
        expect(error).toMatchSnapshot();
      });

      it('should not log the error when code is not 500', () => {
        handleError(createError('test error', 400));
        expect(legacyLogger.error).not.toHaveBeenCalled();

        handleError(createError('test error'));
        expect(legacyLogger.error).toHaveBeenCalledWith(
          `requestId: ${contextRequestId} \ntest error`,
          {}
        );
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
  });

  describe('when error is undefined', () => {
    it('should return generate a new error with code 500', () => {
      const error = handleError();
      expect(error.code).toBe(500);
      expect(error.prettyMessage).toMatch(/Unexpected error has occurred/i);
      expect(error.requestId).toBe(contextRequestId);
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
      expect(legacyLogger.debug.mock.calls[0][0]).toContain('test error');
    });

    describe('and is instance of Error', () => {
      it('should include the original error', () => {
        const error = new Error('test error');
        error.name = 'Original error';
        handleError(createError(error, 400));
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('Original error');
      });
    });
  });

  describe('when the body contains the user and password', () => {
    it('should not show them in the log', () => {
      handleError(createError('test error', 400), {
        req: { body: { username: 'admin', password: '1234' } },
      });
      expect(legacyLogger.debug.mock.calls).toMatchSnapshot();
    });
  });

  describe('when error has ajv validation errors', () => {
    it('should prettify the message', () => {
      const errorInstance = {
        ajv: true,
        code: 400,
        message: 'hello',
        validations: [
          {
            instancePath: 'a property',
            message: 'an error',
          },
        ],
      };
      const error = handleError(errorInstance);

      expect(error.code).toBe(400);
      const expectedPrettymessage = 'hello\na property: an error';
      expect(error.prettyMessage).toEqual(expectedPrettymessage);
    });
  });
});

describe('handleError without context', () => {
  it('should append a tenant error message to the original error', () => {
    jest.restoreAllMocks();
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    const error = handleError(new Error('original error message'));
    expect(error.prettyMessage).toEqual('original error message');
    expect(legacyLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /\nError: original error message[\w\W]*Accessing nonexistent async context/
      ),
      {}
    );
  });
});

describe('prettifyError', () => {
  describe('when the error does not fall into any other category, and the resulting message would be empty', () => {
    it('should return JSON representation of the original error object as a message.', () => {
      const prettied = prettifyError({
        json: {},
        status: '404',
        headers: 'some_headers',
      });

      expect(prettied.prettyMessage).toBe(
        '{\n  "json": {},\n  "status": "404",\n  "headers": "some_headers"\n}'
      );
    });
  });
});
