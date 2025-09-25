import Ajv, { ValidateFunction } from 'ajv';
import { Schema } from 'ajv/dist/core';

export class ValidationError extends Error {}

export class Validator<T> {
  private errors: ValidationError[] = [];

  private validateFunction: ValidateFunction;

  constructor(schema: Schema) {
    const ajv = new Ajv({ strict: false });
    this.validateFunction = ajv.compile<T>(schema);
  }

  getErrors() {
    return this.errors;
  }

  validate(data: unknown): data is T {
    const result = this.validateFunction(data);
    this.errors = this.validateFunction.errors
      ? this.validateFunction.errors.map(e => new ValidationError(e.message, { cause: e }))
      : [];
    return result;
  }

  ensure(data: unknown): asserts data is T {
    this.validateFunction(data);
    this.errors = this.validateFunction.errors
      ? this.validateFunction.errors.map(e => new ValidationError(e.message, { cause: e }))
      : [];
    if (this.errors.length) {
      throw this.errors[0];
    }
  }
}
