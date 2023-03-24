import util from 'util';

import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';
import { ValidationError } from './ValidationError';

const ajv = new Ajv({ allErrors: true });

type ValidatorSchema<T, Refs extends Record<string, unknown> = {}> = JTDSchemaType<T, Refs>;

function createValidator<T, Refs extends Record<string, unknown> = {}>(
  schema: ValidatorSchema<T, Refs>
) {
  const validator = ajv.compile(schema);
  return (value: unknown): T => {
    const valid = validator(value);
    if (!valid) {
      const error = new ValidationError(
        validator.errors?.map(({ instancePath, message }) => ({
          path: instancePath,
          message: message || '',
        })) || []
      );
      error.message = util.inspect(error, false, null);
      throw error;
    }
    return value as T;
  };
}

export { createValidator };
export type { ValidatorSchema };
