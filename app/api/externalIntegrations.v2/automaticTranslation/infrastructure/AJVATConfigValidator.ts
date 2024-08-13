import { Ajv } from 'ajv';
import { JTDSchemaType } from 'ajv/dist/core';
import { ATConfigValidator } from '../contracts/ATConfigValidator';
import { SemanticConfig } from '../types/SemanticConfig';

const schema: JTDSchemaType<SemanticConfig> = {
  additionalProperties: false,
  properties: {
    active: { type: 'boolean' },
    templates: {
      elements: {
        properties: {
          template: { type: 'string' },
        },
        optionalProperties: {
          properties: { elements: { type: 'string' } },
          commonProperties: { elements: { type: 'string' } },
        },
      },
    },
  },
};

export class AJVATConfigValidator implements ATConfigValidator {
  private errors: string[] = [];

  getErrors() {
    return this.errors;
  }

  validate(data: unknown) {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile<SemanticConfig>(schema);
    const result = validate(data);
    this.errors = validate.errors ? validate.errors?.map(e => JSON.stringify(e.params)) : [];
    return result;
  }
}
