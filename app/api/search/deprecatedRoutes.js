import entities from '#api/entities/index.js';
import { searchParamsSchema } from '#shared/types/searchParameterSchema.js';
import { validation, parseQuery } from '#api/utils/index.js';
import { search } from './search.js';

export default app => {
  app.get(
    '/api/search/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            templateId: { type: 'string' },
          },
          required: ['templateId'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) =>
      entities
        .countByTemplate(req.query.templateId)
        .then(results => res.json(results))
        .catch(next)
  );

  app.get(
    '/api/search',
    parseQuery,
    validation.validateRequest(searchParamsSchema),

    (req, res, next) => {
      const action = req.query.geolocation ? 'searchGeolocations' : 'search';

      return search[action](req.query, req.language, req.user)
        .then(results => res.json(results))
        .catch(next);
    }
  );

  app.get(
    '/api/search_snippets',
    validation.validateRequest(
      {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'object',
            required: ['id'],
            properties: {
              searchTerm: { type: 'string', default: '' },
              id: { type: 'string' },
            },
          },
        },
      },
      'query'
    ),
    (req, res, next) =>
      search
        .searchSnippets(req.query.searchTerm, req.query.id, req.language, req.user)
        .then(results => res.json(results))
        .catch(next)
  );
};
