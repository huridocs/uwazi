import Joi from 'joi';
import objectId from 'joi-objectid';
import entities from './entities';
import templates from '../templates/templates';
import thesauris from '../thesauris/thesauris';
import needsAuthorization from '../auth/authMiddleware';
import { validateRequest } from '../utils';
import { saveSchema, metadataSchema, iconSchema } from './endpointSchema';

Joi.objectId = objectId(Joi);

export default (app) => {
  app.post(
    '/api/entities',
    needsAuthorization(['admin', 'editor']),
    validateRequest(saveSchema),
    (req, res, next) => entities.save(req.body, { user: req.user, language: req.language })
    .then((response) => {
      res.json(response);
      return templates.getById(response.template);
    })
    .then(template => thesauris.templateToThesauri(template, req.language, req.user))
    .then((templateTransformed) => {
      req.io.sockets.emit('thesauriChange', templateTransformed);
    })
    .catch(next)
  );

  app.post(
    '/api/entities/multipleupdate',
    needsAuthorization(['admin', 'editor']),
    validateRequest(Joi.object().keys({
      ids: Joi.array().items(Joi.string()).required(),
      values: Joi.object().keys({
        metadata: metadataSchema,
        template: Joi.string(),
        published: Joi.boolean(),
        icon: iconSchema
      }).required()
    }).required()),
    (req, res, next) => entities.multipleUpdate(req.body.ids, req.body.values, { user: req.user, language: req.language })
    .then((docs) => {
      res.json(docs.map(doc => doc.sharedId));
    })
    .catch(next));

  app.get(
    '/api/entities/count_by_template',
    validateRequest(Joi.object().keys({
      templateId: Joi.objectId().required()
    }).required(), 'query'),
    (req, res, next) => entities.countByTemplate(req.query.templateId)
    .then(response => res.json(response))
    .catch(next)
  );

  app.get(
    '/api/entities/get_raw_page',
    validateRequest(Joi.object().keys({
      sharedId: Joi.string().required(),
      pageNumber: Joi.number().required()
    }).required(), 'query'),
    (req, res, next) => entities.getRawPage(req.query.sharedId, req.language, req.query.pageNumber)
    .then(data => res.json({ data }))
    .catch(next)
  );

  app.get('/api/entities',
    validateRequest(Joi.object().keys({
      _id: Joi.string().required(),
      omitRelationships: Joi.any()
    }).required(), 'query'),
    (req, res, next) => {
      const action = req.query.omitRelationships ? 'get' : 'getWithRelationships';
      entities[action]({ sharedId: req.query._id, language: req.language })
      .then((_entities) => {
        if (!_entities.length || (!_entities[0].published && !req.user)) {
          res.status(404);
          res.json({});
          return;
        }
        res.json({ rows: _entities });
      })
      .catch(next);
    });

  app.delete('/api/entities',
    needsAuthorization(['admin', 'editor']),
    validateRequest(Joi.object().keys({
      sharedId: Joi.string().required()
    }).required(), 'query'),
    (req, res, next) => {
      entities.delete(req.query.sharedId)
      .then(response => res.json(response))
      .catch(next);
    });

  app.post('/api/entities/bulkdelete',
    needsAuthorization(['admin', 'editor']),
    validateRequest(Joi.object().keys({
      sharedIds: Joi.array().items(Joi.string()).required()
    }).required(), 'body'),
    (req, res, next) => {
      entities.deleteMultiple(req.body.sharedIds)
      .then(() => res.json('ok'))
      .catch(next);
    });
};
