import Joi from 'joi';
import objectId from 'joi-objectid';
import { search } from 'api/search';
import { attachmentsPath, files, generateFileName, uploadMiddleware } from 'api/files';
import fs from 'fs';
import entities from './entities';
import templates from '../templates/templates';
import thesauri from '../thesauri/thesauri';
import needsAuthorization from '../auth/authMiddleware';
import { parseQuery, validation } from '../utils';

Joi.objectId = objectId(Joi);

const storeFile = (pathFunction, file) =>
  new Promise((resolve, reject) => {
    const filename = generateFileName(file);
    fs.appendFile(pathFunction(filename), file.buffer, err => {
      if (err) {
        reject(err);
      }
      resolve(Object.assign(file, { filename, destination: pathFunction() }));
    });
  });

export default app => {
  app.post(
    '/api/entities_with_files',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware.multiple(),
    async (req, res, next) => {
      //remove JSON.parse

      //get files by sharedid
      //compare/save/delete each file
      //IMPORTANT! only update originalname (NOT mimetype/size)
      //files.save(req.body)

      // const [deletedFile] = await files.delete(req.query);
      // const thumbnailFileName = `${deletedFile._id}.jpg`;
      // await files.delete({ filename: thumbnailFileName });

      try {
        const entityToSave = JSON.parse(req.body.entity);
        const entity = await entities.save(entityToSave, {
          user: req.user,
          language: req.language,
        });
        const attachments = [];
        if (req.files.length) {
          await Promise.all(
            req.files.map(file =>
              storeFile(attachmentsPath, file).then(_file =>
                attachments.push({
                  ..._file,
                  entity: entity.sharedId,
                  type: 'attachment',
                })
              )
            )
          );
        }
        await Promise.all(attachments.map(attachment => files.save(attachment)));

        const [entityWithAttachments] = await entities.getUnrestrictedWithDocuments(
          {
            sharedId: entity.sharedId,
            language: entity.language,
          },
          '+permissions'
        );

        return res.json(entityWithAttachments);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    '/api/entities',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    (req, res, next) =>
      entities
        .save(req.body, { user: req.user, language: req.language })
        .then(response => {
          res.json(response);
          return templates.getById(response.template);
        })
        .then(async template =>
          thesauri.templateToThesauri(
            template,
            req.language,
            req.user,
            await search.countPerTemplate(req.language)
          )
        )
        .then(templateTransformed => {
          req.sockets.emitToCurrentTenant('thesauriChange', templateTransformed);
        })
        .catch(next)
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
    validation.validateRequest(
      Joi.object()
        .keys({
          templateId: Joi.objectId().required(),
        })
        .required(),
      'query'
    ),
    (req, res, next) =>
      entities
        .countByTemplate(req.query.templateId)
        .then(response => res.json(response))
        .catch(next)
  );

  app.get(
    '/api/entities/get_raw_page',
    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string().required(),
          pageNumber: Joi.number().required(),
        })
        .required(),
      'query'
    ),
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
      properties: {
        query: {
          properties: {
            sharedId: { type: 'string' },
            _id: { type: 'string' },
            withPdf: { type: 'string' },
            omitRelationships: { type: 'boolean' },
            include: { type: 'array', items: [{ type: 'string', enum: ['permissions'] }] },
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
    validation.validateRequest(
      Joi.object()
        .keys({
          sharedId: Joi.string().required(),
        })
        .required(),
      'query'
    ),
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
    validation.validateRequest(
      Joi.object()
        .keys({
          sharedIds: Joi.array()
            .items(Joi.string())
            .required(),
        })
        .required(),
      'body'
    ),
    (req, res, next) => {
      entities
        .deleteMultiple(req.body.sharedIds)
        .then(() => res.json('ok'))
        .catch(next);
    }
  );
};
