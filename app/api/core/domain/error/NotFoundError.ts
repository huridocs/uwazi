import { DomainError, ErrorCategory } from './DomainError.js';

abstract class NotFoundError extends DomainError {
  static readonly category: ErrorCategory = 'not_found';
}

export { NotFoundError };
