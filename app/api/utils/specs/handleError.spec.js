/* eslint-disable max-statements */
import util from 'node:util';
import { z } from 'zod';
import { errors as elasticErrors } from '@elastic/elasticsearch';
import { legacyLogger } from '#api/log/index.js';
import { createError } from '#api/utils/index.js';
import { OperationalError } from '#api/common.v2/errors/OperationalError.js';
import { S3Error } from '#api/files/S3Storage.js';
import { IXValidationError } from '#api/services/informationextraction/IXValidationError.js';
import { PXValidationError } from '#api/paragraphExtraction/domain/PXValidationError.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { handleError, prettifyError } from '../handleError.js';

const contextRequestId = '1234';

const { ConnectionError } = elasticErrors;

class TestDomainError extends DomainError {}

describe('handleError', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    jest.spyOn(legacyLogger, 'debug').mockImplementation(() => {});
    jest.spyOn(ExecutionContext, 'getStore').mockReturnValue({});
    jest.spyOn(ExecutionContext, 'correlationId', 'get').mockReturnValue(contextRequestId);
  });

  describe('errors by type', () => {
    describe('when error is bodyparser error parsing a json', () => {
      it('should be a 422 debug logLevel', () => {
        const errorInstance = new SyntaxError('parsing error');
        errorInstance.type = 'entity.parse.failed';
        const error = handleError(errorInstance);
        expect(error).toMatchObject({ code: 400, logLevel: 'debug' });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('parsing error');
      });
    });
    describe('and is instance of OperationalError', () => {
      it('should be a 422 debug logLevel', () => {
        const errorInstance = new OperationalError('operational error');
        const error = handleError(errorInstance);
        expect(error).toMatchObject({ code: 400, logLevel: 'debug' });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('operational error');
      });
    });
    describe('and is instance of NonRetryableJobError', () => {
      it('should be a 422 debug logLevel', () => {
        const errorInstance = new NonRetryableJobError(new Error('job error'));
        const error = handleError(errorInstance);
        expect(error).toMatchObject({ code: 422, logLevel: 'debug' });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('job error');
      });
    });
    describe('and is instance of IXValidationError', () => {
      it('should be a 422 debug logLevel', () => {
        const errorInstance = new IXValidationError(
          IXValidationError.codes.TEMPLATE_MISSING,
          'template not found'
        );
        const error = handleError(errorInstance);
        expect(error).toMatchObject({ code: 422, logLevel: 'debug' });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('template not found');
      });
    });

    describe('and is instance of PXValidationError', () => {
      it('should be a 422 debug logLevel', () => {
        const errorInstance = new PXValidationError('code', 'segmentation files not found');
        const error = handleError(errorInstance);
        expect(error).toMatchObject({ code: 422, logLevel: 'debug' });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('segmentation files not found');
      });
    });
    describe('and is instance of S3Error', () => {
      it('should be a debug logLevel and use the error httpStatusCode', () => {
        const originalError = new Error('original error');
        originalError.$metadata = { httpStatusCode: 404 };
        const errorInstance = new S3Error(originalError);
        const error = handleError(errorInstance);
        expect(error).toMatchObject({
          code: 404,
          logLevel: 'debug',
        });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('original error');
      });
      it('should use 503 status code if httpStatusCode is undefined', () => {
        const originalError = new Error('original error');
        originalError.$metadata = {};
        const errorInstance = new S3Error(originalError);
        const error = handleError(errorInstance);
        expect(error).toMatchObject({
          code: 503,
          logLevel: 'debug',
        });
        expect(legacyLogger.debug.mock.calls[0][0]).toContain('original error');
      });
    });

    describe('when error is instance of Error', () => {
      it('should return the error with 500 code without the original error and error stack', () => {
        const errorInstance = new Error('error');

        const error = handleError(errorInstance);

        expect(error.code).toBe(500);
        expect(error.requestId).toBe(contextRequestId);
        expect(error.prettyMessage).toEqual('A server side error has occurred');
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
      expect(error.prettyMessage).toMatch(/A server side error has occurred/i);
      expect(error.requestId).toBe(contextRequestId);
    });
  });

  it('should have a default "error" logLevel', () => {
    const error = handleError({ message: 'error' });
    expect(error.logLevel).toBe('error');
  });

  describe('when error is uncaught', () => {
    it('should append the info into the message', () => {
      const uncaught = true;
      const error = handleError({ message: 'error' }, { uncaught });
      expect(error.message).toBe(
        'uncaught exception or unhandled rejection, gracefully shutting down uwazi\n error'
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

    describe('when error is a ZodError', () => {
      it('should be a 422 info logLevel and logged as info', () => {
        try {
          z.string().url().parse('not-a-valid-url');
        } catch (e) {
          const error = handleError(e);
          expect(error).toMatchObject({ code: 422, logLevel: 'debug' });
          expect(legacyLogger.debug).toHaveBeenCalled();
        }
      });
    });
  });

  it('should handle URIError correctly', () => {
    const uriError = new URIError('URI malformed');
    const error = handleError(uriError);

    expect(error).toMatchObject({
      code: 404,
      message: uriError.message,
      logLevel: 'debug',
    });
  });

  it('should handle DomainError correctly', () => {
    const result = handleError(new TestDomainError('Test error', 'code'));

    expect(result).toMatchObject({
      code: 400,
      message: 'Test error',
      logLevel: 'debug',
      prettyMessage: '\nTest error',
    });
  });

  describe('when the error is unexpected', () => {
    it('should not expose error details', () => {
      const sensitiveError = new Error('Sensitive error message', {
        cause: 'Sensitive error cause',
      });
      const domainError = new TestDomainError('Test error', 'code');

      expect(handleError(sensitiveError)).toMatchObject({
        code: 500,
        logLevel: 'error',
        requestId: contextRequestId,
        prettyMessage: 'A server side error has occurred',
        error: 'A server side error has occurred',
      });

      expect(handleError(domainError)).toMatchObject({
        code: 400,
        logLevel: 'debug',
        requestId: contextRequestId,
        prettyMessage: '\nTest error',
      });
    });

    it('should log errors correctly', () => {
      const sensitiveError = new Error('Sensitive error message', {
        cause: 'Sensitive error cause',
      });

      handleError(sensitiveError);

      expect(legacyLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive error message'),
        {}
      );
    });

    it('should hide native Error subclasses (TypeError, RangeError, etc.)', () => {
      const typeError = new TypeError('Cannot read property password of undefined');
      const rangeError = new RangeError('Maximum call stack at sensitiveFunction');
      const referenceError = new ReferenceError('secretApiKey is not defined');

      expect(handleError(typeError)).toMatchObject({
        code: 500,
        logLevel: 'error',
        requestId: contextRequestId,
        prettyMessage: 'A server side error has occurred',
        error: 'A server side error has occurred',
      });

      expect(handleError(rangeError)).toMatchObject({
        code: 500,
        logLevel: 'error',
        requestId: contextRequestId,
        prettyMessage: 'A server side error has occurred',
        error: 'A server side error has occurred',
      });

      expect(handleError(referenceError)).toMatchObject({
        code: 500,
        logLevel: 'error',
        requestId: contextRequestId,
        prettyMessage: 'A server side error has occurred',
        error: 'A server side error has occurred',
      });
    });
  });
});

describe('handleError without context', () => {
  it('should degrade gracefully with no requestId and no tenant error', () => {
    jest.restoreAllMocks();
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    const error = handleError(new Error('original error message'));
    expect(error.prettyMessage).toEqual('A server side error has occurred');
    expect(error.requestId).toBeUndefined();
    expect(error.tenantError).toBeUndefined();
    expect(legacyLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\nError: original error message/),
      {}
    );
  });
});

describe('prettifyError', () => {
  describe('when the error does not fall into any other category, and the resulting message would be empty', () => {
    it('should return code 500 and JSON representation of the original error object as a message.', () => {
      const prettied = prettifyError({
        json: {},
        status: '404',
        headers: 'some_headers',
      });

      expect(prettied.code).toBe(500);
      expect(prettied.prettyMessage).toBe(
        '{\n  "json": {},\n  "status": "404",\n  "headers": "some_headers"\n}'
      );
    });
  });
});
