import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from './ValidationError';

type ValidatorProps = {
  code: string;
  schema: ZodSchema;
  name: string;
};

export class Validator {
  static z = z;

  private schema: ZodSchema;

  private code: string;

  private name: string;

  constructor(props: ValidatorProps) {
    this.schema = props.schema;
    this.code = props.code;
    this.name = props.name;
  }

  validate(data: unknown) {
    try {
      this.schema.parse(data);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new ValidationError('', this.code, this.name);
      }

      throw e;
    }
  }
}
