/* eslint-disable max-lines */
/* eslint-disable max-statements */
import activitylogMiddleware from '#api/activitylog/activitylogMiddleware.js';
import { uploadMiddleware } from '#api/files/index.js';
import { tenants } from '#api/tenants/index.js';
import { withTransaction } from '#api/utils/withTransaction.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { BulkDeleteEntityController } from '#api/core/infrastructure/express/entity/BulkDeleteEntityController.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoEntitiesDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import { UpdateEntityController } from '#api/core/infrastructure/express/entity/UpdateEntityController.js';
import { GetEntityController } from '#api/core/infrastructure/express/entity/GetEntityController.js';
import { MultiUpdateEntityController } from '#api/core/infrastructure/express/entity/MultiUpdateEntityController.js';
import { DeleteEntityController } from '#api/core/infrastructure/express/entity/DeleteEntityController.js';
import { CreateEntityFromPDFController } from '#api/core/infrastructure/express/entity/CreateEntityFromPDFController.js';
import needsAuthorization from '../auth/authMiddleware.js';
import { parseQuery, validation } from '../utils/index.js';
import date from '../utils/date.js';
import entities from './entities.js';
import { saveEntity } from './entitySavingManager.js';
import { User } from '#api/users.v2/model/User.js';

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
    activitylogMiddleware,
    (req, res, next) => {
      const entityToSave = req.body.entity ? JSON.parse(req.body.entity) : req.body;

      if (!tenants.current()?.featureFlags?.v2UpdateEntity && entityToSave.sharedId) {
        return uploadMiddleware.multiple()(req, res, next);
      }

      return new UploadMiddleware(LoggerFactory.default()).multiple()(req, res, next);
    },
    async (req, res, next) => {
      const entityToSave = req.body.entity ? JSON.parse(req.body.entity) : req.body;

      if (!entityToSave?.sharedId) {
        const entityDAO = new MongoEntitiesDAO(
          getConnection(),
          TransactionManagerFactory.default(),
          User.createFrom(req.user)
        );
        const result = await EntityFacade.create(entityToSave, req.language, req.inputFiles);
        const [entityInTargetLanguage] = await entityDAO.getWithFiles({
          language: req.language,
          sharedId: result.sharedId,
        });

        const response = req.body.entity
          ? { entity: entityInTargetLanguage, errors: [] }
          : entityInTargetLanguage;

        res.json(response);

        return;
      }

      if (tenants.current()?.featureFlags?.v2UpdateEntity && entityToSave?.sharedId) {
        await UpdateEntityController.createHandler()(req, res, next);
        return;
      }

      try {
        const result = await withTransaction(async ({ abort }) => {
          const saveResult = await saveEntity(entityToSave, {
            user: req.user,
            language: req.language,
            socketEmiter: req.emitToSessionSocket,
            files: req.files,
          });
          const { errors } = saveResult;
          if (errors.length) {
            await abort();
          }
          return req.body.entity ? saveResult : saveResult.entity;
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
    MultiUpdateEntityController.createHandler()
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
            omitRelationships: { type: 'boolean' },
            include: { type: 'array', items: { type: 'string', enum: ['permissions'] } },
          },
        },
      },
    }),
    async (req, res, next) => {
      // V2 implementation
      if (tenants.current()?.featureFlags?.v2GetEntity) {
        await GetEntityController.createHandler()(req, res, next);
        return;
      }

      // V1 implementation
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
          if (!req.user && _entities[0].relations) {
            const entity = _entities[0];
            entity.relations = entity.relations.filter(rel => rel.entityData.published);
          }
          res.json({ rows: _entities });
        })
        .catch(next);
    }
  );

  app.delete(
    '/api/entities',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    DeleteEntityController.createHandler()
  );

  app.post(
    '/api/entities/bulkdelete',
    needsAuthorization(['admin', 'editor']),
    BulkDeleteEntityController.createHandler()
  );

  app.post(
    '/api/entities/create-from-pdf',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    (req, res, next) =>
      new UploadMiddleware(LoggerFactory.default()).singleUpload('document')(req, res, next),
    CreateEntityFromPDFController.createHandler(),
    activitylogMiddleware
  );
};
