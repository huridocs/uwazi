import Ajv from 'ajv';
import { objectIdSchema } from 'shared/types/commonSchemas';
import { wrapValidator } from 'shared/tsUtils';
import { TranslationType } from './translationType';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true, removeAdditional: true });

export const translationSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  additionalProperties: false,
  title: 'TranslationType',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    locale: { type: 'string', minLength: 1 },
    contexts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          _id: objectIdSchema,
          id: { type: 'string', minLength: 1 },
          label: { type: 'string', minLength: 1 },
          type: { type: 'string', minLength: 1 },
          values: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                _id: objectIdSchema,
                key: { type: 'string', minLength: 1 },
                value: { type: 'string', minLength: 1 },
              },
            },
          },
        },
      },
    },
  },
};

const validate = wrapValidator(ajv.compile(translationSchema));

export const validateTranslation = async (translation: TranslationType): Promise<TranslationType> =>
  validate({ ...translation });
