import Joi from 'joi';
import entities from 'api/entities';
import search from './search';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

const parseQueryProperty = (query, property) => {
  try {
    return JSON.parse(query[property]);
  } catch (e) {
    return query[property];
  }
};

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
    (req, _res, next) => {
      console.log(req.query);

      req.query = Object.keys(req.query).reduce((parsedQuery, key) => {
        parsedQuery[key] = parseQueryProperty(req.query, key);
        return parsedQuery;
      }, {});

      next();
    },
    validation.validateRequest({
      properties: {
        query: {
          properties: {
            filters: { type: 'object' },
            types: { type: 'array', items: [{ type: 'string' }] },
            _types: { type: 'array', items: [{ type: 'string' }] },
            fields: { type: 'string' },
            allAggregations: { type: 'boolean' },
            userSelectedSorting: { type: 'string' },
            aggregations: { type: 'string' },
            order: { type: 'string', enum: ['asc', 'desc'] },
            sort: { type: 'string' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            searchTerm: { type: 'string' },
            includeUnpublished: { type: 'boolean' },
            treatAs: { type: 'string' },
            unpublished: { type: 'boolean' },
            select: { type: 'array', items: [{ type: 'string' }] },
            geolocation: { type: 'boolean' },
          },
        },
      },
    }),

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
      Joi.object().keys({
        searchTerm: Joi.string().allow(''),
        id: Joi.string(),
      }),
      'query'
    ),
    (req, res, next) =>
      search
        .searchSnippets(req.query.searchTerm, req.query.id, req.language)
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
