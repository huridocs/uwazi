import Joi from 'joi';

import settings from 'api/settings';
import { updateMapping } from 'api/search/entitiesIndex';
import { tenants } from 'api/tenants/tenantContext';

import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import templates from './templates';

export default app => {
  app.post('/api/templates', needsAuthorization(), async (req, res, next) => {
    try {
      const response = await templates.save(req.body, req.language);

      req.io.emitToCurrentTenant('templateChange', response);
      const updatedSettings = await settings.updateFilterName(
        response._id.toString(),
        response.name
      );
      if (updatedSettings) {
        req.io.emitToCurrentTenant('updateSettings', updatedSettings);
      }

      const templs = await templates.get();
      await updateMapping(templs, tenants.current().indexName);

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

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
          req.io.emitToCurrentTenant('templateChange', newDefault);
          if (oldDefault) {
            req.io.emitToCurrentTenant('templateChange', oldDefault);
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
          req.io.emitToCurrentTenant('updateSettings', newSettings);
          req.io.emitToCurrentTenant('templateDelete', template);
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
