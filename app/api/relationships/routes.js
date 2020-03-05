/** @format */

import Joi from 'joi';
import relationships from './relationships.js';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/relationships/bulk', needsAuthorization(['admin', 'editor']), (req, res, next) => {
    relationships
      .bulk(req.body, req.language)
      .then(response => res.json(response))
      .catch(next);
  });

  app.post(
    '/api/references',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId(),
          __v: Joi.number(),
          entity: Joi.string(),
          hub: Joi.string().allow(''),
          template: Joi.string(),
          metadata: Joi.any(),
          language: Joi.string(),
          range: Joi.object().keys({
            start: Joi.number(),
            end: Joi.number(),
            text: Joi.string(),
          }),
        })
        .required()
    ),
    (req, res, next) => {
      relationships
        .save(req.body, req.language)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.delete(
    '/api/references',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId().required(),
        })
        .required(),
      'query'
    ),
    (req, res, next) => {
      relationships
        .delete({ _id: req.query._id }, req.language)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get(
    '/api/references/by_document/',
    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string().required(),
          file: Joi.string(),
        })
        .required(),
      'query'
    ),
    (req, res, next) => {
      const unpublished = Boolean(req.user && ['admin', 'editor'].includes(req.user.role));
      relationships
        .getByDocument(req.query.sharedId, req.language, unpublished, req.query.file)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get('/api/references/group_by_connection/', (req, res, next) => {
    relationships
      .getGroupsByConnection(req.query.sharedId, req.language, {
        excludeRefs: true,
        user: req.user,
      })
      .then(response => {
        res.json(response);
      })
      .catch(next);
  });

  app.get(
    '/api/references/search/',
    validation.validateRequest(
      Joi.object().keys({
        sharedId: Joi.string().allow(''),
        filter: Joi.string().allow(''),
        limit: Joi.string().allow(''),
        sort: Joi.string().allow(''),
        order: Joi.string(),
        treatAs: Joi.string(),
        searchTerm: Joi.string().allow(''),
      }),
      'query'
    ),
    (req, res, next) => {
      req.query.filter = JSON.parse(req.query.filter || '{}');
      const { sharedId, ...query } = req.query;
      relationships
        .search(req.query.sharedId, query, req.language, req.user)
        .then(results => res.json(results))
        .catch(next);
    }
  );

  app.get(
    '/api/references/count_by_relationtype',
    validation.validateRequest(
      Joi.object()
        .keys({
          relationtypeId: Joi.objectId().required(),
        })
        .required(),
      'query'
    ),
    (req, res, next) => {
      relationships
        .countByRelationType(req.query.relationtypeId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
