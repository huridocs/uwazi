import { DomainError, ErrorCategory } from './DomainError.js';

abstract class ConflictError extends DomainError {
  static readonly category: ErrorCategory = 'conflict';
}

export { ConflictError };
