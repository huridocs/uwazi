import util from 'util';

import Ajv from 'ajv';
import { JTDSchemaType } from 'ajv/dist/types/jtd-schema';
import { ValidationError } from './ValidationError';

const ajv = new Ajv({ allErrors: true });

type ValidatorSchema<T, Refs extends Record<string, unknown>> = JTDSchemaType<T, Refs>;

function createValidator<T, Refs extends Record<string, unknown> = {}>(
  schema: ValidatorSchema<T, Refs>
) {
  const validator = ajv.compile(schema);
  return (value: unknown): value is T => {
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
    return true;
  };
}

export { createValidator };
export type { ValidatorSchema };
