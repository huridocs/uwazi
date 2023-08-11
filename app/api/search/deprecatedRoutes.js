import Joi from 'joi';
import entities from 'api/entities';
import { searchParamsSchema } from 'shared/types/searchParameterSchema';
import { search } from './search';
import { validation, parseQuery } from '../utils';

export default app => {
  app.get(
    '/api/search/count_by_template',
    validation.validateRequest(
      Joi.object()
        .keys({
          templateId: Joi.string().required(),
        })
        .required(),
      'query'
    ),
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
