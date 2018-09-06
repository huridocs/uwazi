import Joi from 'joi';
import relationships from './relationships.js';
import { validateRequest } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/relationships/bulk',
    needsAuthorization(['admin', 'editor']),
    validateRequest(Joi.array().items(
      Joi.object().keys({
        _id: Joi.string(),
        __v: Joi.number(),
        entity: Joi.string(),
        hub: Joi.string().allow(''),
        template: Joi.string(),
        metadata: Joi.any(),
        language: Joi.string(),
        range: Joi.object().keys({
          start: Joi.number(),
          end: Joi.number(),
          text: Joi.string()
        })
      })
    ).required()),
    (req, res, next) => {
      relationships.bulk(req.body, req.language)
      .then(response => res.json(response))
      .catch(next);
    }
  );

  app.post('/api/references',
    needsAuthorization(['admin', 'editor']),
    validateRequest(Joi.object().keys({
      _id: Joi.string(),
      __v: Joi.number(),
      entity: Joi.string(),
      hub: Joi.string().allow(''),
      template: Joi.string(),
      metadata: Joi.any(),
      language: Joi.string(),
      range: Joi.object().keys({
        start: Joi.number(),
        end: Joi.number(),
        text: Joi.string()
      })
    }).required()),
    (req, res, next) => {
      relationships.save(req.body, req.language)
      .then(response => res.json(response))
      .catch(next);
    }
  );

  app.delete('/api/references',
    needsAuthorization(['admin', 'editor']),
    validateRequest(Joi.object().keys({
      _id: Joi.string().required()
    }).required(), 'query'),
    (req, res, next) => {
      relationships.delete({ _id: req.query._id }, req.language)
      .then(response => res.json(response))
      .catch(next);
    }
  );

  app.get('/api/references/by_document/:id', (req, res, next) => {
    relationships.getByDocument(req.params.id, req.language)
    .then(response => res.json(response))
    .catch(next);
  });

  app.get('/api/references/group_by_connection/:id', (req, res, next) => {
    relationships.getGroupsByConnection(req.params.id, req.language, { excludeRefs: true, user: req.user })
    .then((response) => {
      res.json(response);
    })
    .catch(next);
  });

  app.get('/api/references/search/:id',
    validateRequest(Joi.object().keys({
      filter: Joi.string().allow(''),
      limit: Joi.string().allow(''),
      sort: Joi.string().allow(''),
      order: Joi.string(),
      treatAs: Joi.string(),
      searchTerm: Joi.string().allow('')
    }), 'query'),
    (req, res, next) => {
      req.query.filter = JSON.parse(req.query.filter || '{}');
      relationships.search(req.params.id, req.query, req.language, req.user)
      .then(results => res.json(results))
      .catch(res.error, next);
    }
  );

  app.get('/api/references/count_by_relationtype',
    validateRequest(Joi.object().keys({
      relationtypeId: Joi.string().required()
    }).required(), 'query'),
    (req, res, next) => {
      relationships.countByRelationType(req.query.relationtypeId)
      .then(response => res.json(response))
      .catch(next);
    }
  );
};
