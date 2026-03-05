import { objectIdSchema, metadataSchema } from '#shared/types/commonSchemas.js';
import { fileSchema } from '#shared/types/fileSchema.js';
import { permissionSchema } from '#shared/types/permissionSchema.js';

export const emitSchemaTypes = true;

export const entitySchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  definitions: {
    objectIdSchema,
    metadataSchema,
    permissionSchema,
  },
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    mongoLanguage: { type: 'string' },
    title: { type: 'string', minLength: 1 },
    template: objectIdSchema,
    published: { type: 'boolean' },
    generatedToc: { type: 'boolean' },
    icon: {
      type: 'object',
      additionalProperties: false,
      properties: {
        _id: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        label: { type: 'string' },
        type: { type: 'string' },
      },
    },
    creationDate: { type: 'number' },
    user: objectIdSchema,
    metadata: metadataSchema,
    obsoleteMetadata: { type: 'array', items: { type: 'string' } },
    permissions: {
      type: 'array',
      items: permissionSchema,
    },
  },
};

export const entityWithFilesSchema = {
  type: 'object',

  definitions: {
    fileSchema,
    objectIdSchema,
    metadataSchema,
  },
  allOf: [
    entitySchema,
    {
      properties: {
        attachments: {
          type: 'array',
          items: fileSchema,
        },
        documents: {
          type: 'array',
          items: fileSchema,
        },
      },
    },
  ],
};
