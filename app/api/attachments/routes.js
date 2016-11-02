import {db_url as dbUrl} from '../config/database';
import needsAuthorization from '../auth/authMiddleware';
import multer from 'multer';
import ID from 'shared/uniqueID';
import request from '../../shared/JSONRequest';
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
    request.get(`${dbUrl}/${req.query._id}`)
    .then(response => {
      const file = response.json.attachments.find(a => a.filename === req.query.file);
      const newName = path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.filename);
      res.download(attachmentsPath + file.filename, sanitize(newName));
    })
    .catch((error) => {
      res.json({error: error.json}, 500);
    });
  });

  app.post('/api/attachments/upload', needsAuthorization, upload.any(), (req, res) => {
    return request.get(`${dbUrl}/${req.body.entityId}`)
    .then(entityResponse => {
      const entity = entityResponse.json;
      entity.attachments = entity.attachments || [];
      entity.attachments.push(req.files[0]);
      return entities.saveMultiple([entity]);
    })
    .then(() => {
      res.json(req.files[0]);
    })
    .catch(error => res.json({error: error}));
  });

  app.delete('/api/attachments/delete', needsAuthorization, (req, res) => {
    return request.get(`${dbUrl}/${req.query.entityId}`)
    .then(entityResponse => {
      const entity = entityResponse.json;
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
          resolve(res.json(response.json[0]));
        });
      });
    })
    .catch(error => {
      res.json({error: error});
    });
  });
};
