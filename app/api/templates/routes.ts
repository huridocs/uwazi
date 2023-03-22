import { Application, Request } from 'express';
import settings from 'api/settings';
import { reindexAll } from 'api/search/entitiesIndex';
import { search } from 'api/search';
import { createError, validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import templates from './templates';

const reindexAllTemplates = async () => {
  const allTemplates = await templates.get();
  return reindexAll(allTemplates, search);
};

const handleMappingConflict = async <T>(callback: () => Promise<T>) => {
  try {
    return await callback();
  } catch (e: any) {
    if (e.meta?.body?.error?.reason?.match(/mapp[ing|er]/)) {
      throw createError('mapping conflict', 409);
    }
    throw e;
  }
};

export default (app: Application) => {
  app.post('/api/templates', needsAuthorization(), async (req, res, next) => {
    try {
      const { reindex: fullReindex, ...template } = req.body;

      const response = await handleMappingConflict(async () =>
        templates.save(template, req.language, !fullReindex)
      );

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
      type: 'object',
      properties: {
        body: {
          type: 'object',
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
      type: 'object',
      properties: {
        query: {
          type: 'object',
          required: ['_id'],
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),
    (req: Request<{}, {}, {}, { _id: string }>, res, next) => {
      const template = { _id: req.query._id };
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
      type: 'object',
      properties: {
        query: {
          type: 'object',
          required: ['_id'],
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),
    (req: Request<{}, {}, {}, { _id: string }>, res, next) => {
      templates
        .countByThesauri(req.query._id)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
