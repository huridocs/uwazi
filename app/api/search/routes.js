import Joi from 'joi';
import entities from 'api/entities';
import search from './search';
import { validateRequest } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

const parseQueryProperty = (query, property) => query[property] ? JSON.parse(query[property]) : query[property];

export default (app) => {
  app.get('/api/search/count_by_template',
  validateRequest(Joi.object().keys({
    templateId: Joi.string().required()
  }).required(), 'query'),
  (req, res, next) => entities.countByTemplate(req.query.templateId)
  .then(results => res.json(results))
  .catch(next));

  app.get('/api/search',

    validateRequest(Joi.object().keys({
      filters: Joi.string(),
      types: Joi.string(),
      _types: Joi.string(),
      fields: Joi.string(),
      allAggregations: Joi.string(),
      userSelectedSorting: Joi.string(),
      aggregations: Joi.string(),
      order: Joi.string(),
      sort: Joi.string(),
      limit: Joi.string(),
      searchTerm: Joi.string().allow(''),
      includeUnpublished: Joi.any(),
      treatAs: Joi.string(),
      unpublished: Joi.any(),
      geolocation: Joi.boolean(),
    }), 'query'),

    (req, res, next) => {
      req.query.filters = parseQueryProperty(req.query, 'filters');
      req.query.types = parseQueryProperty(req.query, 'types');
      req.query.fields = parseQueryProperty(req.query, 'fields');
      req.query.aggregations = parseQueryProperty(req.query, 'aggregations');

      const action = req.query.geolocation ? 'searchGeolocations' : 'search';

      return search[action](req.query, req.language, req.user)
      .then(results => res.json(results))
      .catch(next);
    }
  );

  app.get('/api/search_snippets',
  validateRequest(Joi.object().keys({
    searchTerm: Joi.string().allow(''),
    id: Joi.string()
  }), 'query'),
  (req, res, next) => search.searchSnippets(req.query.searchTerm, req.query.id, req.language)
  .then(results => res.json(results))
  .catch(next));

  app.get('/api/search/unpublished', needsAuthorization(['admin', 'editor']), (req, res, next) => {
    search.getUploadsByUser(req.user, req.language)
    .then(response => res.json({ rows: response }))
    .catch(next);
  });
};
