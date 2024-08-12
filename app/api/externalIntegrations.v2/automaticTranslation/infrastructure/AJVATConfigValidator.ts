import { Ajv } from 'ajv';
import { JTDSchemaType } from 'ajv/dist/core';
import { ATConfigValidator } from '../contracts/ATConfigValidator';
import { SemanticConfig } from '../types/SemanticConfig';
import { Validate } from '../types/Validate';

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
  // eslint-disable-next-line class-methods-use-this
  validate(data: unknown): Validate {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile<SemanticConfig>(schema);
    return {
      isValid: validate(data),
      errors: validate.errors ? [JSON.stringify(validate.errors?.[0].params)] : null,
    };
  }
}
