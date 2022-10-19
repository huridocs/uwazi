import util from 'util';

import Ajv, { AnySchemaObject } from 'ajv';
import ValidationError from 'ajv/dist/runtime/validation_error';

const defaultAjv = new Ajv({ allErrors: true });
defaultAjv.addVocabulary(['tsType']);

type ValidatorType<T> = (value: any) => value is T;

const createValidator = <T>(ajvInstance: Ajv, ajvSchema: AnySchemaObject): ValidatorType<T> => {
  const validator = ajvInstance.compile<T>(ajvSchema);
  return (value: any): value is T => {
    const valid = validator(value);
    if (!valid) {
      const err = new ValidationError(validator.errors || []);
      err.message = util.inspect(err, false, null);
      throw err;
    }
    return true;
  };
};

const createDefaultValidator = <T>(ajvSchema: AnySchemaObject) =>
  createValidator<T>(defaultAjv, ajvSchema);

export type { ValidatorType };
export { createDefaultValidator };
