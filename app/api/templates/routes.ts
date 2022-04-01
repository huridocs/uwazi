import { Application } from 'express';
import settings from 'api/settings';
import { checkMapping, reindexAll } from 'api/search/entitiesIndex';
import { search } from 'api/search';
import { TemplateSchema } from 'shared/types/templateType';
import { createError, validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import templates from './templates';
import { generateNames } from './utils';
import { checkIfReindex } from './reindex';

const reindexAllTemplates = async () => {
  const allTemplates = await templates.get();
  return reindexAll(allTemplates, search);
};

const saveTemplate = async (template: TemplateSchema, language: string, fullReindex?: boolean) => {
  const templateStructureChanges = await checkIfReindex(template);
  return templates.save(
    template,
    language,
    !fullReindex && !template.synced,
    templateStructureChanges
  );
};

const prepareRequest = async (body: TemplateSchema & { reindex?: boolean }) => {
  const request = { ...body };
  const { reindex: fullReindex } = request;
  delete request.reindex;
  const template = { ...request };

  const templateProperties = await generateNames(template.properties || []);
  const { valid, error } = await checkMapping({ ...template, properties: templateProperties });

  return { template, fullReindex, valid, error };
};

export default (app: Application) => {
  app.post('/api/templates', needsAuthorization(), async (req, res, next) => {
    try {
      const { template, fullReindex, valid, error } = await prepareRequest(req.body);

      if (!valid && !fullReindex) throw createError(error, 409);

      const response = await saveTemplate(template, req.language, fullReindex);

      req.sockets.emitToCurrentTenant('templateChange', response);

      const updatedSettings = await settings.updateFilterName(
        response._id.toString(),
        response.name
      );

      if (updatedSettings) req.sockets.emitToCurrentTenant('updateSettings', updatedSettings);

      if (fullReindex) await reindexAllTemplates();

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  app.post(
    '/api/templates/setasdefault',
    needsAuthorization(),
    validation.validateRequest({
      properties: {
        body: {
          required: ['_id'],
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
          required: ['_id'],
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
          required: ['_id'],
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
