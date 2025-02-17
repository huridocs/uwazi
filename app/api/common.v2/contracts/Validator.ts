import { z, ZodSchema } from 'zod';

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
    this.schema.parse(data);
  }
}
