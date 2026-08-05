import { objectIdSchema } from '#shared/types/commonSchemas.js';

export const PageDraftSchema = {
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  title: 'PageDraft',
  additionalProperties: false,
  properties: {
    content: { type: 'string' },
    script: { type: 'string' },
    css: { type: 'string' },
  },
};

export const PageReleaseSchema = {
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  title: 'PageRelease',
  additionalProperties: false,
  properties: {
    version: { type: 'integer', minimum: 1 },
    content: { type: 'string' },
    script: { type: 'string' },
    css: { type: 'string' },
    // eslint-disable-next-line camelcase
    release_message: { type: 'string' },
    user: objectIdSchema,
    date: { type: 'number' },
  },
  required: ['version', 'content', 'date'],
};

export const PageLocaleSchema = {
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  title: 'PageLocale',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    draft: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: { type: 'string' },
        script: { type: 'string' },
        css: { type: 'string' },
      },
    },
  },
};

export const PageSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  validatePageIsNotEntityView: true,
  additionalProperties: false,
  title: 'PageType',
  definitions: {
    objectIdSchema,
    pageDraft: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: { type: 'string' },
        script: { type: 'string' },
        css: { type: 'string' },
      },
    },
    pageLocale: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        draft: { $ref: '#/definitions/pageDraft' },
      },
    },
    pageRelease: {
      type: 'object',
      additionalProperties: false,
      properties: {
        version: { type: 'integer', minimum: 1 },
        content: { type: 'string' },
        script: { type: 'string' },
        css: { type: 'string' },
        release_message: { type: 'string' },
        user: objectIdSchema,
        date: { type: 'number' },
      },
      required: ['version', 'content', 'date'],
    },
  },
  properties: {
    _id: objectIdSchema,
    title: { type: 'string' },
    language: { type: 'string' },
    sharedId: { type: 'string' },
    creationDate: { type: 'number' },
    metadata: {
      type: 'object',
      additionalProperties: false,
      definitions: { objectIdSchema },
      properties: {
        _id: objectIdSchema,
        content: { type: 'string' },
        script: { type: 'string' },
        css: { type: 'string' },
      },
    },
    locales: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/pageLocale' },
    },
    draft: { $ref: '#/definitions/pageDraft' },
    releases: {
      type: 'array',
      items: { $ref: '#/definitions/pageRelease' },
    },
    releasesByLocale: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/definitions/pageRelease' },
      },
    },
    entityView: { type: 'boolean' },
    markdownSupport: { type: 'boolean' },
    __v: { type: 'number' },
  },
};

export const PageEditorSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  validatePageIsNotEntityView: true,
  additionalProperties: false,
  title: 'PageEditorPayload',
  definitions: PageSchema.definitions,
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string' },
    creationDate: { type: 'number' },
    entityView: { type: 'boolean' },
    markdownSupport: { type: 'boolean' },
    locales: {
      type: 'object',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string' },
          draft: { $ref: '#/definitions/pageDraft' },
        },
      },
    },
  },
  required: ['locales'],
};

export const emitSchemaTypes = true;
