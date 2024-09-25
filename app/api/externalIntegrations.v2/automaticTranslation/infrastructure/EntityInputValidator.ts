import { Ajv } from 'ajv';
import { JTDSchemaType } from 'ajv/dist/core';
import { EntityInputData } from '../RequestEntityTranslation';
import { EntityInputValidator } from '../contracts/EntityInputValidator';
import { LanguageISO6391Schema } from 'shared/types/commonSchemas';
// import { LanguageISO6391 } from 'shared/types/commonTypes';

const LanguagesISO6391 = ['es', 'en'] as const;
type LanguageISO6391_V2 = (typeof LanguagesISO6391)[number];

const schema: JTDSchemaType<EntityInputData> = {
  additionalProperties: true,
  properties: {
    _id: { type: 'string' },
    sharedId: { type: 'string' },
    language: { enum: LanguagesISO6391 },
    title: { type: 'string' },
    template: { type: 'string' },
    published: { type: 'boolean' },
  },
};

export class AJVEntityInputValidator implements EntityInputValidator {
  private errors: Error[] = [];

  getErrors() {
    return this.errors;
  }

  validate(data: unknown) {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile<EntityInputData>(schema);
    const result = validate(data);
    this.errors = validate.errors
      ? validate.errors?.map(e => new Error('validation error', { cause: e }))
      : [];
    return result;
  }
}
