import util from 'util';

import Ajv, { AnySchemaObject } from 'ajv';
import ValidationError from 'ajv/dist/runtime/validation_error';

const defaultAjv = new Ajv({ allErrors: true });

type validatorType = (value: any) => Promise<any>;

const createValidator = <T>(ajvInstance: Ajv, ajvSchema: AnySchemaObject): validatorType => {
  const validator = ajvInstance.compile<T>(ajvSchema);
  return async (value: T) => {
    const valid = validator(value);
    if (!valid) {
      const err = new ValidationError(validator.errors || []);
      err.message = util.inspect(err, false, null);
      throw err;
    }
  };
};

const createDefaultValidator = (ajvSchema: AnySchemaObject) =>
  createValidator(defaultAjv, ajvSchema);

export type { validatorType };
export { createDefaultValidator };
