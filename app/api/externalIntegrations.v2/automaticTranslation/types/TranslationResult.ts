import { JTDSchemaType } from 'ajv/dist/core';

interface TranslationResult {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
  translations: {
    text: string;
    language: string;
    success: boolean;
    error_message: string;
  }[];
}

const translationResultSchema: JTDSchemaType<TranslationResult> = {
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

export { translationResultSchema };
export type { TranslationResult };
