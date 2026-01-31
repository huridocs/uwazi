/* eslint-disable max-lines */
/* eslint-disable max-statements */
import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import { uploadMiddleware } from 'api/files';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import { UploadMiddleware } from 'api/core/infrastructure/express/middlewares/UploadMiddleware';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { BulkDeleteEntityController } from 'api/core/infrastructure/express/entity/BulkDeleteEntityController';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoEntityDAO } from 'api/core/infrastructure/mongodb/entity/MongoEntityDAO';
import { EntityFacade } from 'api/core/infrastructure/facades/EntitiesFacade';
import { UpdateEntityController } from 'api/core/infrastructure/express/entity/UpdateEntityController';
import { withTransaction } from 'api/utils/withTransaction';
import needsAuthorization from '../auth/authMiddleware';
import templates from '../core/v1_layer/templates/templates';
import { thesauri } from '../thesauri/thesauri';
import { parseQuery, validation } from '../utils';
import date from '../utils/date';
import entities from './entities';
import { saveEntity } from './entitySavingManager';

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
    (req, res, next) => {
      const entityToSave = req.body.entity ? JSON.parse(req.body.entity) : req.body;

      if (tenants.current()?.featureFlags?.v2CreateEntity && !entityToSave?.sharedId) {
        return new UploadMiddleware(LoggerFactory.default()).multiple()(req, res, next);
      }

      if (tenants.current()?.featureFlags?.v2UpdateEntity && entityToSave?.sharedId) {
        return new UploadMiddleware(LoggerFactory.default()).multiple()(req, res, next);
      }

      return uploadMiddleware.multiple()(req, res, next);
    },
    activitylogMiddleware,
    async (req, res, next) => {
      const entityToSave = req.body.entity ? JSON.parse(req.body.entity) : req.body;

      if (tenants.current()?.featureFlags?.v2CreateEntity && !entityToSave?.sharedId) {
        const entityDAO = new MongoEntityDAO(getConnection(), TransactionManagerFactory.default());
        const result = await EntityFacade.create(entityToSave, req.inputFiles);
        const entityInTargetLanguage = await entityDAO
          .getWithFile({ language: req.language, sharedId: result.sharedId })
          .next();

        await updateThesauriWithEntity(entityInTargetLanguage, req);

        // Return in the same format as V1 for client compatibility
        const response = req.body.entity
          ? { entity: entityInTargetLanguage, errors: [] }
          : entityInTargetLanguage;

        res.json(response);

        return;
      }

      if (tenants.current()?.featureFlags?.v2UpdateEntity && entityToSave?.sharedId) {
        return UpdateEntityController.createHandler()(req, res, next);
      }

      try {
        const result = await withTransaction(async ({ abort }) => {
          const saveResult = await saveEntity(entityToSave, {
            user: req.user,
            language: req.language,
            socketEmiter: req.emitToSessionSocket,
            files: req.files,
          });
          const { entity, errors } = saveResult;
          await updateThesauriWithEntity(entity, req);
          if (errors.length) {
            await abort();
          }
          return req.body.entity ? saveResult : entity;
        }, 'POST /api/entities');
        res.json(result);
        req.emitToSessionSocket(
          'documentProcessed',
          req.body.entity ? result.entity.sharedId : result.sharedId
        );
      } catch (e) {
        next(e);
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
    BulkDeleteEntityController.createHandler()
  );
};
