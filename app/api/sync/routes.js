import multer from 'multer';

import { models } from 'api/odm';
import entities from 'api/entities';
import path from 'path';
import search from 'api/search/search';

import { uploadDocumentsPath } from '../config/paths';
import { needsAuthorization } from '../auth';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.normalize(`${uploadDocumentsPath}/`));
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  }
});


export default (app) => {
  const upload = multer({ storage });

  app.post(
    '/api/sync',
    needsAuthorization(['admin']),
    async (req, res, next) => {
      try {
        if (req.body.namespace === 'settings') {
          const [settings] = await models.settings.get({});
          req.body.data._id = settings._id;
        }

        await models[req.body.namespace].save(req.body.data);

        if (req.body.namespace === 'entities') {
          await entities.indexEntities({ _id: req.body.data._id }, '+fullText');
        }
        res.json('ok');
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    '/api/sync/upload',
    needsAuthorization(['admin']),
    upload.any(),
  );

  app.delete(
    '/api/sync',
    needsAuthorization(['admin']),
    async (req, res, next) => {
      try {
        await models[req.query.namespace].delete(JSON.parse(req.query.data));
        if (req.query.namespace === 'entities') {
          try {
            await search.delete({ _id: JSON.parse(req.query.data)._id });
          } catch (err) {
            if (err.statusCode !== 404) { throw err; }
          }
        }
        res.json('ok');
      } catch (e) {
        next(e);
      }
    }
  );
};
