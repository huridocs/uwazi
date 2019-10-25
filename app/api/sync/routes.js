/** @format */

import multer from 'multer';

import { models } from 'api/odm';
import entities from 'api/entities';
import path from 'path';
import search from 'api/search/search';

import { needsAuthorization } from '../auth';
import paths from '../config/paths';

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.normalize(`${paths.uploadedDocuments}/`));
  },
  filename(_req, file, cb) {
    cb(null, file.originalname);
  },
});

export default app => {
  const upload = multer({ storage });

  app.post('/api/sync', needsAuthorization(['admin']), async (req, res, next) => {
    try {
      if (req.body.namespace === 'settings') {
        const [settings] = await models.settings.get({});
        req.body.data._id = settings._id;
      }
      const saver = Array.isArray(req.body.data)
        ? models[req.body.namespace].saveMultiple(req.body.data)
        : models[req.body.namespace].save(req.body.data);
      await saver;

      if (req.body.namespace === 'entities') {
        await entities.indexEntities({ _id: req.body.data._id }, '+fullText');
      }
      res.json('ok');
    } catch (e) {
      next(e);
    }
  });

  app.post('/api/sync/upload', needsAuthorization(['admin']), upload.any(), (_req, res) => {
    res.json('ok');
  });

  app.delete('/api/sync', needsAuthorization(['admin']), async (req, res, next) => {
    try {
      await models[req.query.namespace].delete(JSON.parse(req.query.data));
      if (req.query.namespace === 'entities') {
        try {
          await search.delete({ _id: JSON.parse(req.query.data)._id });
        } catch (err) {
          if (err.statusCode !== 404) {
            throw err;
          }
        }
      }
      res.json('ok');
    } catch (e) {
      next(e);
    }
  });
};
