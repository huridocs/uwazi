import Joi from 'joi';

import { validation } from 'api/utils';

import needsAuthorization from '../auth/authMiddleware';
import pages from './pages';

export default app => {
  app.post(
    '/api/pages',

    needsAuthorization(),

    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId(),
          __v: Joi.number(),
          sharedId: Joi.string(),
          title: Joi.string().required(),
          language: Joi.string(),
          metadata: Joi.object().keys({
            _id: Joi.objectId(),
            content: Joi.string().allow(''),
            script: Joi.string().allow(''),
          }),
        })
        .required()
    ),

    (req, res, next) =>
      pages
        .save(req.body, req.user, req.language)
        .then(response => res.json(response))
        .catch(next)
  );

  app.get(
    '/api/pages',

    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string(),
        })
        .required(),
      'query'
    ),

    (req, res, next) => {
      pages
        .get({ ...req.query, language: req.language })
        .then(res.json.bind(res))
        .catch(next);
    }
  );

  app.get(
    '/api/page',

    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string(),
        })
        .required(),
      'query'
    ),

    (req, res, next) => {
      pages
        .getById(req.query.sharedId, req.language)
        .then(res.json.bind(res))
        .catch(next);
    }
  );

  app.delete(
    '/api/pages',
    needsAuthorization(),

    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string(),
        })
        .required(),
      'query'
    ),

    (req, res, next) => {
      pages
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
