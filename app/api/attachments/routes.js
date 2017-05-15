import mongoose from 'mongoose';
import needsAuthorization from '../auth/authMiddleware';
import multer from 'multer';
import ID from 'shared/uniqueID';
import fs from 'fs';

import path from 'path';
import sanitize from 'sanitize-filename';
import entities from 'api/entities';

import {attachmentsPath} from '../config/paths';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, attachmentsPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ID() + path.extname(file.originalname));
  }
});

export default (app) => {
  let upload = multer({storage});

  app.get('/api/attachments/download', (req, res) => {
    entities.getById(req.query._id)
    .then(response => {
      const file = response.attachments.find(a => a.filename === req.query.file);
      const newName = path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.filename);
      res.download(attachmentsPath + file.filename, sanitize(newName));
    })
    .catch((error) => res.json({error}, 500));
  });

  app.post('/api/attachments/upload', needsAuthorization(['admin', 'editor']), upload.any(), (req, res) => {
    let addedFile;

    return entities.getById(req.body.entityId)
    .then(entity => {
      entity.attachments = entity.attachments || [];

      addedFile = req.files[0];
      addedFile._id = mongoose.Types.ObjectId();

      entity.attachments.push(addedFile);
      return entities.saveMultiple([entity]);
    })
    .then(() => {
      res.json(addedFile);
    })
    .catch(error => res.json({error}));
  });

  app.post('/api/attachments/rename', needsAuthorization(['admin', 'editor']), (req, res) => {
    let renamedAttachment;

    return entities.getById(req.body.entityId)
    .then(entity => {
      if (entity._id.toString() === req.body._id) {
        entity.file.originalname = req.body.originalname;
        renamedAttachment = Object.assign({_id: entity._id.toString()}, entity.file);
      } else {
        entity.attachments = (entity.attachments || []).map(attachment => {
          if (attachment._id.toString() === req.body._id) {
            attachment.originalname = req.body.originalname;
            renamedAttachment = attachment;
          }

          return attachment;
        });
      }

      return entities.saveMultiple([entity]);
    })
    .then(() => {
      res.json(renamedAttachment);
    })
    .catch((error) => res.json({error}, 500));
  });

  app.delete('/api/attachments/delete', needsAuthorization(['admin', 'editor']), (req, res) => {
    return entities.getById(req.query.entityId)
    .then(entity => {
      entity.attachments = (entity.attachments || []).filter(a => a.filename !== req.query.filename);
      return entities.saveMultiple([entity]);
    })
    .then(response => {
      return new Promise((resolve, reject) => {
        fs.unlink(attachmentsPath + req.query.filename, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res.json(response[0]));
        });
      });
    })
    .catch(error => {
      res.json({error: error});
    });
  });
};
