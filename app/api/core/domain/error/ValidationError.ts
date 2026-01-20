import { DomainError } from '#api/core/domain/error/DomainError.js';

type AJVObject = {
  keyword: string;
  message: string;
  instancePath?: string;
};

abstract class ValidationError extends DomainError {
  abstract asAJV(): AJVObject;
}

export { ValidationError };
export type { AJVObject };
