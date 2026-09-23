/* eslint-disable max-classes-per-file */
import { z } from 'zod';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { NotFoundError } from '#api/core/domain/error/NotFoundError.js';
import { ConflictError } from '#api/core/domain/error/ConflictError.js';
import { AJVObject, ValidationError } from '#api/core/domain/error/ValidationError.js';
import { ErrorPayloadSchema } from '../../contracts/ErrorPayload.js';
import { ConfigMissing } from '../../runtime/ConfigMissing.js';
import { ErrorMapper } from '../ErrorMapper.js';
import { UsageError } from '../UsageError.js';
import { ExitCode } from '../ExitCode.js';

class RuleBroken extends DomainError {
  constructor() {
    super('Cannot delete last remaining user', 'user.last_user');
  }
}

class Missing extends NotFoundError {
  constructor() {
    super('User bob not found', 'user.not_found');
  }
}

class Duplicated extends ConflictError {
  constructor() {
    super('The username "bob" already exists', 'user.duplicated_user');
  }
}

class InvalidLanguage extends ValidationError {
  constructor() {
    super('Language "xx" is not installed.', 'entity.language.unknown_language_error');
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'unknownLanguage', instancePath: 'language' };
  }
}

const zodError = () => {
  const result = z
    .object({ email: z.string().email(), assignedGroupIds: z.array(z.string()) })
    .safeParse({ email: 'nope', assignedGroupIds: 'x' });
  if (result.success) throw new Error('expected a zod error');
  return result.error;
};

const fieldMap = { email: '--email', assignedGroupIds: '--groups', language: '--language' };

describe('ErrorMapper', () => {
  describe('toExitCode()', () => {
    it.each([
      [zodError(), ExitCode.Validation],
      [new InvalidLanguage(), ExitCode.Validation],
      [new Missing(), ExitCode.NotFound],
      [new Duplicated(), ExitCode.Conflict],
      [new RuleBroken(), ExitCode.RuleViolation],
      [new UsageError('Unknown argument: foo'), ExitCode.Validation],
      [new ConfigMissing(['MONGO_URI']), ExitCode.Unexpected],
      [new Error('boom'), ExitCode.Unexpected],
      ['not even an error', ExitCode.Unexpected],
    ])('should map %s to %s', (error, exitCode) => {
      expect(ErrorMapper.toExitCode(error)).toBe(exitCode);
    });
  });

  describe('toPayload()', () => {
    it('should list every zod issue under its CLI flag name', () => {
      expect(ErrorMapper.toPayload(zodError(), fieldMap)).toEqual({
        error: {
          code: 'validation.failed',
          category: 'validation',
          message: 'Invalid arguments',
          validation: [
            { field: '--email', code: 'invalid_string', message: 'Invalid email' },
            {
              field: '--groups',
              code: 'invalid_type',
              message: 'Expected array, received string',
            },
          ],
        },
      });
    });

    it('should keep the internal path when a field has no flag mapping', () => {
      const payload = ErrorMapper.toPayload(zodError(), {});

      expect(payload.error.validation?.map(v => v.field)).toEqual(['email', 'assignedGroupIds']);
    });

    it('should map a domain validation error through asAJV()', () => {
      expect(ErrorMapper.toPayload(new InvalidLanguage(), fieldMap).error).toEqual({
        code: 'entity.language.unknown_language_error',
        category: 'validation',
        message: 'Language "xx" is not installed.',
        validation: [
          {
            field: '--language',
            code: 'unknownLanguage',
            message: 'Language "xx" is not installed.',
          },
        ],
      });
    });

    it.each([
      [new Missing(), 'user.not_found', 'not_found'],
      [new Duplicated(), 'user.duplicated_user', 'conflict'],
      [new RuleBroken(), 'user.last_user', 'rule_violation'],
    ])('should keep code, category and message of %s', (error, code, category) => {
      expect(ErrorMapper.toPayload(error, fieldMap).error).toEqual({
        code,
        category,
        message: error.message,
      });
    });

    it('should report a usage error as a validation failure', () => {
      expect(ErrorMapper.toPayload(new UsageError('Unknown argument: foo'), {}).error).toEqual({
        code: 'usage.invalid',
        category: 'validation',
        message: 'Unknown argument: foo',
      });
    });

    it('should expose the missing variables of ConfigMissing as details', () => {
      expect(ErrorMapper.toPayload(new ConfigMissing(['MONGO_URI', 'POSTGRES_DB']), {})).toEqual({
        error: {
          code: 'config.missing',
          category: 'unexpected',
          message: 'Missing required configuration: MONGO_URI, POSTGRES_DB',
          details: { missing: ['MONGO_URI', 'POSTGRES_DB'] },
        },
      });
    });

    it('should report anything else as unexpected', () => {
      expect(ErrorMapper.toPayload(new Error('boom'), {}).error).toEqual({
        code: 'unexpected',
        category: 'unexpected',
        message: 'boom',
      });
      expect(ErrorMapper.toPayload('a string', {}).error).toEqual({
        code: 'unexpected',
        category: 'unexpected',
        message: 'a string',
      });
    });

    it('should attach the correlationId when given', () => {
      expect(ErrorMapper.toPayload(new Missing(), {}, 'corr-1').error.correlationId).toBe('corr-1');
    });

    it.each([zodError(), new InvalidLanguage(), new Missing(), new ConfigMissing(['X']), 1])(
      'should always produce a payload that honours the contract (%s)',
      error => {
        expect(() =>
          ErrorPayloadSchema.parse(ErrorMapper.toPayload(error, fieldMap))
        ).not.toThrow();
      }
    );
  });
});
