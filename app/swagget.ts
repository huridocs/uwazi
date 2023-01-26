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
  paths: {
    '/api/v2/search': {
      get: {
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
                      items: entitySchema,
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
      post: {
        summary: 'Create or update a page',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
        },
        responses: {
          200: {
            description: 'Will return the page created / updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: PageSchema,
                  },
                },
              },
            },
          },
        },
      },
      get: {
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
                      items: PageSchema,
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
                    data: PageSchema,
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
