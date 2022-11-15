import { entitySchema } from 'shared/types/entitySchema';
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
  },
};

// console.log(JSON.stringify(swaggerDocument));
