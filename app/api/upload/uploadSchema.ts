/** @format */

import Ajv from 'ajv';
import { objectIdSchema, tocSchema } from 'shared/types/commonSchemas';
import { wrapValidator } from 'shared/tsUtils';
import { UploadSchema } from './uploadType';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true, removeAdditional: true });

export const uploadSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    originalname: { type: 'string', minLength: 1 },
    filename: { type: 'string', minLength: 1 },
    mimetype: { type: 'string', minLength: 1 },
    size: { type: 'number' },
    creationDate: { type: 'number' },
    language: { type: 'string', minLength: 1 },
    type: { type: 'string', enum: ['custom', 'document'] },
    totalPages: { type: 'number' },
    fullText: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        '^[0-9]+$': { type: 'string' },
      },
    },
    toc: {
      type: 'array',
      items: tocSchema,
    },
    pdfInfo: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        '^[0-9]+$': {
          type: 'object',
          additionalProperties: false,
          properties: {
            chars: { type: 'number' },
          },
        },
      },
    },
  },
};

const validate = wrapValidator(ajv.compile(uploadSchema));

export const validateUpload = async (upload: UploadSchema): Promise<UploadSchema> =>
  validate({ ...upload });
