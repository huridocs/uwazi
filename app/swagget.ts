import { entitySchema } from 'shared/types/entitySchema';
import { PageSchema } from 'shared/types/pageSchema';
import { searchGetParameters } from 'shared/types/SearchQuerySchema';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Uwazi API',
    description: '',
    version: '1.0.0',
  },
  components: {
    schemas: {
      entity: entitySchema,
      page: {
        ...PageSchema,
        properties: {
          ...PageSchema.properties,
          _id: { type: 'string' },
          user: { type: 'string' },
          metadata: {
            ...PageSchema.properties.metadata,
            properties: {
              ...PageSchema.properties.metadata.properties,
              _id: { type: 'string' },
            },
          },
        },
        $async: false,
      },
    },
  },
  paths: {
    '/api/v2/search': {
      get: {
        tags: ['/v2/search'],
        summary: 'Search entities',
        description: 'Search entities',
        parameters: searchGetParameters,
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
            required: true,
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
            required: true,
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

console.log(JSON.stringify(swaggerDocument));
