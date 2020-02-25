import Joi from 'joi';

import settings from 'api/settings';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import templates from './templates';

export default app => {
  app.post(
    '/api/templates',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.string(),
          __v: Joi.number(),
          name: Joi.string().required(),
          color: Joi.string().allow(''),
          default: Joi.boolean(),
          properties: Joi.array()
            .required()
            .items(
              Joi.object().keys({
                _id: Joi.string(),
                id: Joi.string(),
                localID: Joi.string(),
                label: Joi.string(),
                name: Joi.string(),
                nestedProperties: Joi.array(),
                type: Joi.string(),
                relationType: Joi.string(),
                filter: Joi.boolean(),
                noLabel: Joi.boolean(),
                defaultfilter: Joi.boolean(),
                required: Joi.boolean(),
                inherit: Joi.boolean(),
                inheritProperty: Joi.string()
                  .allow(null)
                  .allow(''),
                sortable: Joi.boolean(),
                showInCard: Joi.boolean(),
                fullWidth: Joi.boolean(),
                content: Joi.alternatives().when('type', {
                  is: 'relationship',
                  then: Joi.string().allow(['']),
                  otherwise: Joi.string(),
                }),
                prioritySorting: Joi.boolean(),
                style: Joi.string(),
                inserting: Joi.any(),
              })
            ),
          commonProperties: Joi.array().items(
            Joi.object().keys({
              _id: Joi.string(),
              localID: Joi.string(),
              isCommonProperty: Joi.boolean(),
              label: Joi.string(),
              name: Joi.string(),
              prioritySorting: Joi.boolean(),
              type: Joi.string(),
            })
          ),
        })
        .required()
    ),
    (req, res, next) => {
      templates
        .save(req.body, req.language)
        .then(response => {
          req.io.sockets.emit('templateChange', response);
          return Promise.all([
            response,
            settings.updateFilterName(response._id.toString(), response.name),
          ]);
        })
        .then(([response, updatedSettings]) => {
          if (updatedSettings) {
            req.io.sockets.emit('updateSettings', updatedSettings);
          }
          res.json(response);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/templates/setasdefault',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object().keys({
        _id: Joi.string().required(),
      })
    ),
    (req, res, next) => {
      templates
        .setAsDefault(req.body._id)
        .then(([newDefault, oldDefault]) => {
          req.io.sockets.emit('templateChange', newDefault);
          if (oldDefault) {
            req.io.sockets.emit('templateChange', oldDefault);
          }
          res.json(newDefault);
        })
        .catch(next);
    }
  );

  app.get('/api/templates', (_req, res, next) => {
    templates
      .get()
      .then(response => res.json({ rows: response }))
      .catch(next);
  });

  app.delete(
    '/api/templates',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object({
        _id: Joi.string().required(),
      }).required(),
      'query'
    ),
    (req, res, next) => {
      const template = { _id: req.query._id };
      templates
        .delete(template)
        .then(() => settings.removeTemplateFromFilters(template._id))
        .then(newSettings => {
          res.json(template);
          req.io.sockets.emit('updateSettings', newSettings);
          req.io.sockets.emit('templateDelete', template);
        })
        .catch(next);
    }
  );

  app.get(
    '/api/templates/count_by_thesauri',

    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.string().required(),
        })
        .required(),
      'query'
    ),

    (req, res, next) => {
      templates
        .countByThesauri(req.query._id)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
