import { DomainError } from './DomainError';

type AJVObject = {
  keyword: string;
  message: string;
};

abstract class ValidationError extends DomainError {
  abstract asAJV(): AJVObject;
}

export { ValidationError };
export type { AJVObject };
