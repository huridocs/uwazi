import util from 'util';

import Ajv, { AnySchemaObject } from 'ajv';
import ValidationError from 'ajv/dist/runtime/validation_error';

const defaultAjv = new Ajv({ allErrors: true });
defaultAjv.addVocabulary(['tsType']);

type ValidatorType = (value: any) => any;

const createValidator = <T>(ajvInstance: Ajv, ajvSchema: AnySchemaObject): ValidatorType => {
  const validator = ajvInstance.compile<T>(ajvSchema);
  return (value: T) => {
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

const getValidatorMiddleware = (validator: ValidatorType) => async (req, _res, next) =>
  validator(req);

export type { ValidatorType };
export { createDefaultValidator, getValidatorMiddleware };
