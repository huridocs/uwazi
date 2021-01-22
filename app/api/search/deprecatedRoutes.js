import Joi from 'joi';
import entities from 'api/entities';
import { searchSchema } from 'api/search/searchSchema';
import search from './search';
import { validation, parseQuery } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

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
    validation.validateRequest(searchSchema),

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

  app.get('/api/search/unpublished', needsAuthorization(['admin', 'editor']), (req, res, next) => {
    search
      .getUploadsByUser(req.user, req.language)
      .then(response => res.json({ rows: response }))
      .catch(next);
  });
};
