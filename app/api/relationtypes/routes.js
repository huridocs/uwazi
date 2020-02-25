import Joi from 'joi';
import relationtypes from 'api/relationtypes/relationtypes';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post(
    '/api/relationtypes',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId(),
          __v: Joi.number(),
          name: Joi.string(),
          properties: Joi.array().items(
            Joi.object().keys({
              _id: Joi.string(),
              __v: Joi.number(),
              localID: Joi.string(),
              id: Joi.string(),
              label: Joi.string(),
              type: Joi.string(),
              content: Joi.string(),
              name: Joi.string(),
              filter: Joi.boolean(),
              sortable: Joi.boolean(),
              showInCard: Joi.boolean(),
              prioritySorting: Joi.boolean(),
              nestedProperties: Joi.array(),
            })
          ),
        })
        .required()
    ),
    (req, res, next) => {
      relationtypes
        .save(req.body)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get(
    '/api/relationtypes',
    validation.validateRequest(
      Joi.object().keys({
        _id: Joi.objectId(),
      }),
      'query'
    ),
    (req, res, next) => {
      if (req.query._id) {
        return relationtypes
          .getById(req.query._id)
          .then(response => res.json({ rows: [response] }))
          .catch(next);
      }

      relationtypes
        .get()
        .then(response => res.json({ rows: response }))
        .catch(next);
    }
  );

  app.delete(
    '/api/relationtypes',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId().required(),
        })
        .required(),
      'query'
    ),
    (req, res, next) => {
      relationtypes
        .delete(req.query._id)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
