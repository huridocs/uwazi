import Ajv, { Schema } from 'ajv';
import { InvalidInputDataFormat } from '../errors/generateATErrors';

export function validateInput<T>(schema: Schema, data: unknown): asserts data is T {
  const ajv = new Ajv({ strict: true });
  const validate = ajv.compile<T>(schema);
  validate(data);
  if (validate.errors?.length) {
    throw new InvalidInputDataFormat(validate.errors[0].message, { cause: validate.errors });
  }
}
