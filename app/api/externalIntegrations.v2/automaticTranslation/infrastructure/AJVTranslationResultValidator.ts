import { Ajv } from 'ajv';
import { JTDSchemaType } from 'ajv/dist/core';
import { TranslationResult } from '../types/TranslationResult';
import { ATTranslationResultValidator } from '../contracts/ATTranslationResultValidator';

const schema: JTDSchemaType<TranslationResult> = {
  additionalProperties: false,
  properties: {
    key: { elements: { type: 'string' } },
    text: { type: 'string' },
    language_from: { type: 'string' },
    languages_to: { elements: { type: 'string' } },
    translations: {
      elements: {
        properties: {
          text: { type: 'string' },
          language: { type: 'string' },
          success: { type: 'boolean' },
          error_message: { type: 'string' },
        },
      },
    },
  },
};

export class AJVTranslationResultValidator implements ATTranslationResultValidator {
  private errors: string[] = [];

  getErrors() {
    return this.errors;
  }

  validate(data: unknown) {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile<TranslationResult>(schema);
    const result = validate(data);
    this.errors = validate.errors ? validate.errors?.map(e => JSON.stringify(e.params)) : [];
    return result;
  }
}
