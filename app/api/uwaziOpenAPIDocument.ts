/* eslint-disable max-lines */
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

export const uwaziOpenAPIDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Uwazi API',
    description: '',
    version: '1.0.0',
  },
  components: {
    schemas: {
      file: {
        type: 'object',
        additionalProperties: false,
        properties: {
          _id: { type: 'string' },
          entity: { type: 'string', minLength: 1 },
          originalname: { type: 'string', minLength: 1 },
          filename: { type: 'string', minLength: 1 },
          mimetype: { type: 'string', minLength: 1 },
          size: { type: 'number' },
          creationDate: { type: 'number' },
          language: { type: 'string', minLength: 1 },
          type: { type: 'string', enum: ['custom', 'document', 'thumbnail', 'attachment'] },
          url: { type: 'string', pattern: '^https://' },
          status: { type: 'string', enum: ['processing', 'failed', 'ready'] },
          totalPages: { type: 'number' },
          generatedToc: { type: 'boolean' },
          uploaded: { type: 'boolean' },
          toc: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                selectionRectangles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      top: { type: 'number' },
                      left: { type: 'number' },
                      width: { type: 'number' },
                      height: { type: 'number' },
                      page: { type: 'string' },
                    },
                  },
                },
                label: { type: 'string' },
                indentation: { type: 'number' },
              },
            },
          },
          extractedMetadata: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                propertyID: { type: 'string' },
                name: { type: 'string' },
                timestamp: { type: 'string' },
                deleteSelection: { type: 'boolean' },
                selection: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    text: { type: 'string' },
                    selectionRectangles: {
                      type: 'array',
                      items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          top: { type: 'number' },
                          left: { type: 'number' },
                          width: { type: 'number' },
                          height: { type: 'number' },
                          page: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      entityMetadataValue: {
        oneOf: [
          { type: 'string', nullable: true },
          { type: 'number', nullable: true },
          { type: 'boolean', nullable: true },
          {
            type: 'object',
            nullable: true,
            additionalProperties: false,
            properties: {
              label: { nullable: true, type: 'string' },
              url: { nullable: true, type: 'string' },
            },
          },
          {
            type: 'object',
            nullable: true,
            additionalProperties: false,
            properties: {
              from: { nullable: true, type: 'number' },
              to: { nullable: true, type: 'number' },
            },
          },
          {
            type: 'object',
            nullable: true,
            required: ['lon', 'lat'],
            additionalProperties: false,
            properties: {
              label: { type: 'string' },
              lat: { type: 'number', minimum: -90, maximum: 90 },
              lon: { type: 'number', minimum: -180, maximum: 180 },
            },
          },
          {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              required: ['lon', 'lat'],
              additionalProperties: false,
              properties: {
                label: { type: 'string' },
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lon: { type: 'number', minimum: -180, maximum: 180 },
              },
            },
          },
        ],
      },
      entityMetadata: {
        type: 'object',
        additionalProperties: {
          anyOf: [
            {
              type: 'array',
              items: {
                type: 'object',
                required: ['value'],
                properties: {
                  value: { $ref: '#/components/schemas/entityMetadataValue' },
                  attachment: { type: 'number' },
                  label: { type: 'string' },
                  suggestion_confidence: { type: 'number' },
                  suggestion_model: { type: 'string' },
                  provenance: { type: 'string', enum: ['', 'BULK_ACCEPT'] },
                  inheritedValue: { $ref: '#/components/schemas/entityMetadataValue' },
                  inheritedType: { type: 'string' },
                },
              },
            },
          ],
        },
      },
      entity: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sharedId: { type: 'string', minLength: 1 },
          language: { type: 'string', minLength: 1 },
          title: { type: 'string', minLength: 1 },
          template: { type: 'string' },
          published: { type: 'boolean' },
          generatedToc: { type: 'boolean' },
          icon: {
            type: 'object',
            additionalProperties: false,
            properties: {
              _id: { type: 'string' },
              label: { type: 'string' },
              type: { type: 'string' },
            },
          },
          creationDate: { type: 'number' },
          user: { type: 'string' },
          metadata: { $ref: '#/components/schemas/entityMetadata' },
          suggestedMetadata: { $ref: '#/components/schemas/entityMetadata' },
          obsoleteMetadata: { type: 'array', items: { type: 'string' } },
          attachments: {
            type: 'array',
            items: { $ref: '#/components/schemas/file' },
          },
          documents: {
            type: 'array',
            items: { $ref: '#/components/schemas/file' },
          },
        },
      },
      page: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          language: { type: 'string' },
          sharedId: { type: 'string' },
          creationDate: { type: 'number' },
          metadata: {
            type: 'object',
            additionalProperties: false,
            properties: {
              _id: { type: 'string' },
              content: { type: 'string' },
              script: { type: 'string' },
            },
          },
          user: { type: 'string' },
          entityView: { type: 'boolean' },
        },
        required: ['title'],
      },
    },
  },
  paths: {
    '/api/v2/search': {
      get: {
        tags: ['/v2/search'],
        summary: 'Search entities',
        description: 'Search entities',
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: {
              title: 'Page',
              type: 'object',
              additionalProperties: false,
              properties: {
                limit: { type: 'number' },
                offset: { type: 'number' },
              },
            },
            style: 'deepObject',
          },
          {
            in: 'query',
            name: 'filter',
            schema: {
              type: 'object',
              additionalProperties: {
                anyOf: [
                  {
                    title: 'RangeFilter',
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      from: { type: 'number' },
                      to: { type: 'number' },
                    },
                  },
                  {
                    title: 'CompoundFilter',
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      values: { type: 'array', items: { type: 'string' } },
                      operator: { type: 'string', enum: ['AND', 'OR'] },
                    },
                  },
                  { type: 'string' },
                  { type: 'number' },
                  { type: 'boolean' },
                ],
              },
              properties: {
                searchString: { type: 'string' },
                sharedId: { type: 'string' },
                published: { type: 'boolean' },
              },
            },
            style: 'deepObject',
          },
          {
            in: 'query',
            name: 'sort',
            schema: { type: 'string' },
            style: 'deepObject',
          },
          {
            in: 'query',
            name: 'fields',
            schema: { type: 'array', items: { type: 'string', minLength: 1 } },
            style: 'deepObject',
          },
        ],
        responses: {
          200: {
            description: 'A JSON array of entities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/entity' },
                    },
                    links: {
                      type: 'object',
                      properties: {
                        self: { type: 'string' },
                        first: { nullable: true, type: 'string' },
                        last: { nullable: true, type: 'string' },
                        next: { nullable: true, type: 'string' },
                        prev: { nullable: true, type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/pages': {
      delete: {
        tags: ['/pages'],
        summary: 'delete a page',
        parameters: [
          {
            in: 'query',
            name: 'sharedId',
            schema: { type: 'string' },
            required: true,
          },
          {
            in: 'header',
            name: 'X-Requested-With',
            schema: { type: 'string' },
            example: 'XMLHttpRequest',
          },
          {
            in: 'header',
            name: 'Content-Language',
            schema: { type: 'string' },
            example: 'en',
          },
          {
            in: 'header',
            name: 'Accept-Language',
            schema: { type: 'string' },
            example: 'en',
            description: `The natural language and locale that the client prefers,
            will be used if no content-language is provided, in case none are provided.
            (api will asume default language configured)`,
          },
        ],
        responses: {
          200: {
            description: 'will return acknowledged deletion',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    acknowledged: { type: 'boolean' },
                    deletedCount: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['/pages'],
        summary: 'Create or update a page',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/page' },
              example: {
                title: 'test page',
                metadata: {
                  content: 'my page content',
                },
              },
            },
          },
        },
        parameters: [
          {
            in: 'header',
            name: 'X-Requested-With',
            schema: { type: 'string' },
            example: 'XMLHttpRequest',
          },
          {
            in: 'header',
            name: 'Content-Language',
            schema: { type: 'string' },
            example: 'en',
          },
          {
            in: 'header',
            name: 'Accept-Language',
            schema: { type: 'string' },
            example: 'en',
            description: `The natural language and locale that the client prefers,
            will be used if no content-language is provided, in case none are provided.
            (api will asume default language configured)`,
          },
        ],
        responses: {
          200: {
            description: 'Will return the page created / updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/page' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['/pages'],
        summary: 'Get pages',
        description: 'Get pages',
        parameters: [
          {
            in: 'query',
            name: 'sharedId',
            schema: { type: 'string' },
          },
          {
            in: 'header',
            name: 'Content-Language',
            schema: { type: 'string' },
            example: 'en',
          },
          {
            in: 'header',
            name: 'Accept-Language',
            schema: { type: 'string' },
            example: 'en',
            description: `The natural language and locale that the client prefers,
            will be used if no content-language is provided, in case none are provided.
            (api will asume default language configured)`,
          },
        ],
        responses: {
          200: {
            description: 'Get an array of pages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/page' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/page': {
      get: {
        tags: ['/pages'],
        summary: 'Get a single page',
        description: 'Get a single page',
        parameters: [
          {
            in: 'query',
            name: 'sharedId',
            schema: { type: 'string' },
            required: true,
          },
          {
            in: 'query',
            name: 'slug',
            schema: { type: 'string' },
          },
          {
            in: 'header',
            name: 'Content-Language',
            schema: { type: 'string' },
            example: 'en',
          },
          {
            in: 'header',
            name: 'Accept-Language',
            schema: { type: 'string' },
            example: 'en',
            description: `The natural language and locale that the client prefers,
            will be used if no content-language is provided, in case none are provided.
            (api will asume default language configured)`,
          },
        ],
        responses: {
          200: {
            description: 'Get an array of pages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/page' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
