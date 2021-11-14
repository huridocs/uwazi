/* eslint-disable max-statements */
import { Application } from 'express';
import settings from 'api/settings';
import { checkMapping, reindexAll } from 'api/search/entitiesIndex';
import { search } from 'api/search';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import templates from './templates';
import { generateNamesAndIds } from './utils';
import { checkIfReindex } from './reindex';

export default (app: Application) => {
  app.post('/api/templates', needsAuthorization(), async (req, res, next) => {
    try {
      const { reindex: fullReindex } = req.body;
      delete req.body.reindex;
      const templateProperties = await generateNamesAndIds(req.body.properties);
      const template = { ...req.body, properties: templateProperties };
      const { valid, error } = await checkMapping(template);

      if (!valid && !fullReindex) {
        return res.json({ error: `Reindex requiered: ${error}` });
      }

      const reindex = fullReindex ? false : await checkIfReindex(req.body);
      const response = await templates.save(req.body, req.language, reindex);

      req.sockets.emitToCurrentTenant('templateChange', response);

      const updatedSettings = await settings.updateFilterName(
        response._id.toString(),
        response.name
      );

      if (updatedSettings) {
        req.sockets.emitToCurrentTenant('updateSettings', updatedSettings);
      }

      if (fullReindex) {
        const allTemplates = await templates.get();
        await reindexAll(allTemplates, search);
      }

      return res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // app.post('/api/templates/check_mapping', needsAuthorization(), async (req, res, next) => {
  //   const template = req.body;
  //   template.properties = await generateNamesAndIds(template.properties);
  //   checkMapping(template)
  //     .then(response => res.json(response))
  //     .catch(next);
  // });

  app.post(
    '/api/templates/setasdefault',
    needsAuthorization(),
    validation.validateRequest({
      properties: {
        body: {
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),
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
    validation.validateRequest({
      properties: {
        query: {
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),
    (req, res, next) => {
      const template = { _id: req.query._id, name: req.query.name };
      templates
        .delete(template)
        .then(async () => settings.removeTemplateFromFilters(template._id))
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
    validation.validateRequest({
      properties: {
        query: {
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),
    (req, res, next) => {
      templates
        .countByThesauri(req.query._id)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
