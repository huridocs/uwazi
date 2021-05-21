import Joi from 'joi';

import settings from 'api/settings';
import { checkMapping, reindexAll } from 'api/search/entitiesIndex';
import { search } from 'api/search';

import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import templates from './templates';
import { generateNamesAndIds } from './utils';

export default app => {
  app.post('/api/templates', needsAuthorization(), async (req, res, next) => {
    try {
      const { reindex } = req.body;
      delete req.body.reindex;

      const response = await templates.save(req.body, req.language, !reindex);
      req.sockets.emitToCurrentTenant('templateChange', response);
      const updatedSettings = await settings.updateFilterName(
        response._id.toString(),
        response.name
      );
      if (updatedSettings) {
        req.sockets.emitToCurrentTenant('updateSettings', updatedSettings);
      }

      if (reindex) {
        const allTemplates = await templates.get();
        reindexAll(allTemplates, search);
      }
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
    async (req, res, next) => {
      try {
        const [newDefault, oldDefault] = await templates.setAsDefault(req.body._id.toString());
        req.sockets.emitToCurrentTenant('templateChange', newDefault);
        if (oldDefault) {
          req.sockets.emitToCurrentTenant('templateChange', oldDefault);
        }
        res.json(newDefault);
      } catch (err) {
        next(err);
      }
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
          req.sockets.emitToCurrentTenant('updateSettings', newSettings);
          req.sockets.emitToCurrentTenant('templateDelete', template);
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

  app.post('/api/templates/check_mapping', needsAuthorization(), async (req, res, next) => {
    const template = req.body;
    template.properties = await generateNamesAndIds(template.properties);
    checkMapping(template)
      .then(response => res.json(response))
      .catch(next);
  });
};
