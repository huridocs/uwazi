import { DomainError, ErrorCategory } from './DomainError.js';

type AJVObject = {
  keyword: string;
  message: string;
  instancePath?: string;
};

abstract class ValidationError extends DomainError {
  abstract asAJV(): AJVObject;

  static readonly category: ErrorCategory = 'validation';
}

export { ValidationError };
export type { AJVObject };
