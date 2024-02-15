import { search } from 'api/search';
import { uploadMiddleware } from 'api/files';
import { saveEntity } from 'api/entities/entitySavingManager';
import entities from './entities';
import templates from '../templates/templates';
import thesauri from '../thesauri/thesauri';
import date from '../utils/date';
import needsAuthorization from '../auth/authMiddleware';
import { parseQuery, validation } from '../utils';

async function updateThesauriWithEntity(entity, req) {
  const template = await templates.getById(entity.template);
  const templateTransformed = await thesauri.templateToThesauri(
    template,
    req.language,
    req.user,
    await search.countPerTemplate(req.language)
  );
  req.sockets.emitToCurrentTenant('thesauriChange', templateTransformed);
}

function coerceValues(value, type, locale) {
  let dateSeconds = '';
  switch (type) {
    case 'date':
      dateSeconds = date.dateToSeconds(value, locale);
      return Number.isNaN(dateSeconds) ? { success: false } : { success: true, value: dateSeconds };
    case 'numeric':
      try {
        const numeric = Number.parseFloat(value);
        return !numeric ? { success: false } : { success: true, value: numeric };
      } catch (e) {
        return { success: false };
      }
    case 'text':
      return {
        success: true,
        value: value
          .replace(/(\n|\r)/g, ' ')
          .replace(/ +/g, ' ')
          .trim(),
      };
    default:
      throw Error('Unsupported type');
  }
}

export default app => {
  app.post(
    '/api/entities/coerce_value',
    needsAuthorization(['admin']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            type: { type: 'string' },
            locale: { type: 'string' },
          },
        },
      },
    }),
    async (req, res, next) => {
      const { value, type, locale } = req.body;
      try {
        const coerced = coerceValues(value, type, locale);
        return res.json(coerced);
      } catch (e) {
        return next(e);
      }
    }
  );
  app.post(
    '/api/entities',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware.multiple(),
    async (req, res, next) => {
      try {
        const entityToSave = req.body.entity ? JSON.parse(req.body.entity) : req.body;
        const result = await saveEntity(entityToSave, {
          user: req.user,
          language: req.language,
          socketEmiter: req.emitToSessionSocket,
          files: req.files,
        });
        const { entity } = result;
        await updateThesauriWithEntity(entity, req);
        return res.json(req.body.entity ? result : entity);
      } catch (e) {
        return next(e);
      }
    }
  );

  app.post('/api/entity_denormalize', needsAuthorization(['admin', 'editor']), (req, res, next) =>
    entities
      .denormalize(req.body, { user: req.user, language: req.language })
      .then(response => {
        res.json(response);
      })
      .catch(next)
  );

  app.post(
    '/api/entities/multipleupdate',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    (req, res, next) =>
      entities
        .multipleUpdate(req.body.ids, req.body.values, { user: req.user, language: req.language })
        .then(docs => {
          res.json(docs);
        })
        .catch(next)
  );

  app.get(
    '/api/entities/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            templateId: { type: 'string' },
          },
          required: ['templateId'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) =>
      entities
        .countByTemplate(req.query.templateId)
        .then(response => res.json(response))
        .catch(next)
  );

  app.get(
    '/api/entities/get_raw_page',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: { type: 'string' },
            pageNumber: { type: 'number' },
          },
          required: ['sharedId', 'pageNumber'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) =>
      entities
        .getRawPage(req.query.sharedId, req.language, req.query.pageNumber)
        .then(data => res.json({ data }))
        .catch(next)
  );

  app.get(
    '/api/entities',
    parseQuery,
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: { type: 'string' },
            _id: { type: 'string' },
            withPdf: { type: 'string' },
            omitRelationships: { type: 'boolean' },
            include: { type: 'array', items: { type: 'string', enum: ['permissions'] } },
          },
        },
      },
    }),
    (req, res, next) => {
      const { omitRelationships, include = [], ...query } = req.query;
      const action = omitRelationships ? 'get' : 'getWithRelationships';
      const published = req.user ? {} : { published: true };
      const language = req.language ? { language: req.language } : {};
      entities[action](
        { ...query, ...published, ...language },
        include.map(field => `+${field}`).join(' '),
        {
          limit: 1,
        }
      )
        .then(_entities => {
          if (!_entities.length) {
            res.status(404);
            res.json({ rows: [] });
            return;
          }
          if (!req.user && _entities[0].relationships) {
            const entity = _entities[0];
            entity.relationships = entity.relationships.filter(rel => rel.entityData.published);
          }
          res.json({ rows: _entities });
        })
        .catch(next);
    }
  );

  app.delete(
    '/api/entities',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: { type: 'string' },
          },
          required: ['sharedId'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      entities
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.post(
    '/api/entities/bulkdelete',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            sharedIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['sharedIds'],
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      entities
        .deleteMultiple(req.body.sharedIds)
        .then(() => res.json('ok'))
        .catch(next);
    }
  );
};
