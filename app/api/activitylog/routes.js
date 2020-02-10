import Joi from 'joi';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import activitylog from './activitylog';

export default app => {
  app.get(
    '/api/activitylog',

    needsAuthorization(['admin']),

    validation.validateRequest(
      Joi.object()
        .keys({
          user: Joi.objectId(),
          username: Joi.string(),
          time: Joi.object().keys({
            from: Joi.number(),
            to: Joi.number(),
          }),
          limit: Joi.number(),
          method: Joi.array().items(Joi.string()),
          search: Joi.string(),
        })
        .required()
    ),

    (req, res, next) => {
      req.query.method = req.query.method ? JSON.parse(req.query.method) : req.query.method;
      req.query.time = req.query.time ? JSON.parse(req.query.time) : req.query.time;
      return activitylog
        .get(req.query)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
