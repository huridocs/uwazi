import { ZodError } from 'zod';
import { DomainError, ErrorCategory } from '#api/core/domain/error/DomainError.js';
import { ValidationError } from '#api/core/domain/error/ValidationError.js';
import { ErrorPayload, ErrorPayloadCategory } from '../contracts/ErrorPayload.js';
import { ConfigMissing } from '../runtime/ConfigMissing.js';
import { ExitCode } from './ExitCode.js';
import { UsageError } from './UsageError.js';

/** Domain field name → CLI flag name, so validation issues point at what the user typed. */
type FieldMap = Record<string, string>;

type ValidationIssue = NonNullable<ErrorPayload['error']['validation']>[number];

const EXIT_CODE_BY_CATEGORY: Record<ErrorPayloadCategory, ExitCode> = {
  validation: ExitCode.Validation,
  not_found: ExitCode.NotFound,
  conflict: ExitCode.Conflict,
  rule_violation: ExitCode.RuleViolation,
  unexpected: ExitCode.Unexpected,
};

/** The one place that turns any thrown value into the CLI's exit code and error payload. */
class ErrorMapper {
  static toExitCode(error: unknown): ExitCode {
    return EXIT_CODE_BY_CATEGORY[ErrorMapper.categoryOf(error)];
  }

  static toPayload(error: unknown, fieldMap: FieldMap, correlationId?: string): ErrorPayload {
    return {
      error: {
        ...ErrorMapper.describe(error, fieldMap),
        ...(correlationId ? { correlationId } : {}),
      },
    };
  }

  private static categoryOf(error: unknown): ErrorPayloadCategory {
    if (error instanceof ZodError || error instanceof UsageError) return 'validation';
    if (error instanceof DomainError) return error.category satisfies ErrorCategory;
    return 'unexpected';
  }

  private static describe(error: unknown, fieldMap: FieldMap): ErrorPayload['error'] {
    return ErrorMapper.describeInvalid(error, fieldMap) ?? ErrorMapper.describeFailure(error);
  }

  /** The caller sent something wrong: arguments, command line or a domain validation rule. */
  private static describeInvalid(
    error: unknown,
    fieldMap: FieldMap
  ): ErrorPayload['error'] | undefined {
    if (error instanceof ZodError) {
      return {
        code: 'validation.failed',
        category: 'validation',
        message: 'Invalid arguments',
        validation: error.issues.map(({ path, code, message }) =>
          ErrorMapper.issue({ field: path.join('.'), code, message }, fieldMap)
        ),
      };
    }

    if (error instanceof ValidationError) {
      const { instancePath = '', keyword, message } = error.asAJV();
      return {
        code: error.code,
        category: 'validation',
        message: error.message,
        validation: [ErrorMapper.issue({ field: instancePath, code: keyword, message }, fieldMap)],
      };
    }

    if (error instanceof UsageError) {
      return { code: error.code, category: 'validation', message: error.message };
    }

    return undefined;
  }

  private static describeFailure(error: unknown): ErrorPayload['error'] {
    if (error instanceof DomainError) {
      return { code: error.code, category: error.category, message: error.message };
    }

    if (error instanceof ConfigMissing) {
      return {
        code: error.code,
        category: 'unexpected',
        message: error.message,
        details: { missing: error.missing },
      };
    }

    return {
      code: 'unexpected',
      category: 'unexpected',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  /** `issue.field` arrives as the domain path and leaves as the CLI flag, when one is mapped. */
  private static issue(issue: ValidationIssue, fieldMap: FieldMap): ValidationIssue {
    return { ...issue, field: fieldMap[issue.field] ?? issue.field };
  }
}

export { ErrorMapper };
export type { FieldMap };
