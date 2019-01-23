import Joi from 'joi';
import mongoose from 'mongoose';
import createError from 'api/utils/Error';
import multer from 'multer';
import sanitize from 'sanitize-filename';

import ID from 'shared/uniqueID';
import entities from 'api/entities';
import fs from 'fs';
import path from 'path';
import relationships from 'api/relationships';

import { attachmentsPath } from '../config/paths';
import { validateRequest } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, attachmentsPath);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + ID() + path.extname(file.originalname));
  }
});

const deleteFile = filePath => new Promise((resolve, reject) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(filePath);
  });
});

const assignAttachment = (entity, addedFile) => {
  const conformedEntity = { _id: entity._id, attachments: entity.attachments || [] };
  conformedEntity.attachments.push(addedFile);
  return conformedEntity;
};

const processSingleLanguage = (entity, req) => {
  const addedFile = req.files[0];
  addedFile._id = mongoose.Types.ObjectId();
  return Promise.all([addedFile, entities.saveMultiple([assignAttachment(entity, addedFile)])]);
};

const processAllLanguages = (entity, req) => processSingleLanguage(entity, req)
.then(([addedFile]) => Promise.all([addedFile, entities.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } })]))
.then(([addedFile, siblings]) => {
  const genericAddedFile = Object.assign({}, addedFile);
  delete genericAddedFile._id;

  const additionalLanguageUpdates = [];

  siblings.forEach((sibling) => {
    additionalLanguageUpdates.push(entities.saveMultiple([assignAttachment(sibling, genericAddedFile)]));
  });

  return Promise.all([addedFile].concat(additionalLanguageUpdates));
});

export default (app) => {
  const upload = multer({ storage });

  app.get(
    '/api/attachment/:file',
    (req, res) => {
      const filePath = `${path.resolve(attachmentsPath)}/${path.basename(req.params.file)}`;
      fs.stat(filePath, (err) => {
        if (err) {
          return res.redirect('/public/no-preview.png');
        }
        return res.sendFile(filePath);
      });
    });

  app.get(
    '/api/attachments/download',
    validateRequest(Joi.object().keys({
      _id: Joi.string().required()
    }).required()),
    (req, res, next) => {
      entities.getById(req.query._id)
      .then((response) => {
        if (!response) {
          throw createError('entitiy does not exist', 404);
        }
        const file = response.attachments.find(a => a.filename === req.query.file);
        if (!file) {
          throw createError('file not found', 404);
        }
        const newName = path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.filename);
        res.download(path.join(attachmentsPath, file.filename), sanitize(newName));
      })
      .catch(next);
    });

  app.post(
    '/api/attachments/upload',
    needsAuthorization(['admin', 'editor']),
    upload.any(),
    validateRequest(Joi.object().keys({
      entityId: Joi.string().required()
    }).required()),
    (req, res, next) => entities.getById(req.body.entityId, req.language)
    .then(entity => req.body.allLanguages === 'true' ? processAllLanguages(entity, req) :
      processSingleLanguage(entity, req))
    .then(([addedFile]) => {
      res.json(addedFile);
    })
    .catch(next)
  );

  app.post(
    '/api/attachments/rename',

    needsAuthorization(['admin', 'editor']),

    validateRequest(Joi.object({
      _id: Joi.string().required(),
      entityId: Joi.string().required(),
      originalname: Joi.string().required(),
      language: Joi.string(),
    }).required()),

    (req, res, next) => {
      let renamedAttachment;
      return entities.getById(req.body.entityId)
      .then((entity) => {
        let entityWithRenamedAttachment;
        if (entity._id.toString() === req.body._id) {
          entityWithRenamedAttachment = { ...entity, file: { ...entity.file, originalname: req.body.originalname, language: req.body.language } };
          renamedAttachment = Object.assign({ _id: entity._id.toString() }, entityWithRenamedAttachment.file);
        } else {
          const attachments = (entity.attachments || []).map((attachment) => {
            if (attachment._id.toString() === req.body._id) {
              renamedAttachment = { ...attachment, originalname: req.body.originalname };
              return renamedAttachment;
            }

            return attachment;
          });

          entityWithRenamedAttachment = { ...entity, attachments };
        }


        return entities.saveMultiple([entityWithRenamedAttachment]);
      })
      .then(() => {
        res.json(renamedAttachment);
      })
      .catch(next);
    });

  app.delete(
    '/api/attachments/delete',

    needsAuthorization(['admin', 'editor']),

    validateRequest(Joi.object({
      entityId: Joi.string().required(),
      filename: Joi.string().required(),
    }).required(), 'query'),

    (req, res) => entities.getById(req.query.entityId)
    .then(entity => Promise.all([entity, entities.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } })]))
    .then(([entity, siblings]) => {
      entity.attachments = (entity.attachments || []).filter(a => a.filename !== req.query.filename);
      const deleteTextReferences = [];
      const deleteThumbnails = [];
      if (entity.file && entity.file.filename === req.query.filename) {
        entity.file = null;
        entity.toc = null;
        deleteTextReferences.push(relationships.deleteTextReferences(entity.sharedId, entity.language));
        deleteThumbnails.push(deleteFile(path.join(attachmentsPath, `${entity._id}.jpg`)));
        siblings = siblings.map((e) => {
          deleteTextReferences.push(relationships.deleteTextReferences(e.sharedId, e.language));
          deleteThumbnails.push(deleteFile(path.join(attachmentsPath, `${e._id}.jpg`)));
          e.attachments = (e.attachments || []).filter(a => a.filename !== req.query.filename);
          e.file = null;
          e.toc = null;
          return e;
        });
      }
      return Promise.all([
        entities.saveMultiple([entity]),
        entities.saveMultiple(siblings),
        deleteTextReferences,
        deleteThumbnails
      ]);
    })
    .then(([[entity], siblings]) => {
      const shouldUnlink = siblings.reduce((memo, sibling) => {
        if (sibling.attachments && sibling.attachments.find(a => a.filename === req.query.filename)) {
          return false;
        }
        return memo;
      }, true);

      return !shouldUnlink ? res.json(entity) : deleteFile(path.join(attachmentsPath, req.query.filename)).then(() => res.json(entity));
    })
    .catch((error) => {
      res.json({ error });
    }));
};
