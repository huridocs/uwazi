/* eslint-disable max-lines */
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Uwazi API',
    description: '',
    version: '1.0.0',
  },
  components: {
    schemas: {
      entity: {},
      page: {},
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

export { swaggerDocument };
