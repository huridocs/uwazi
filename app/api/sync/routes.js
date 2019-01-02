import entities from 'api/entities';
import search from 'api/search/search';
import { models } from 'api/odm';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post(
    '/api/sync',
    // needsAuthorization(['admin']),
    async (req, res, next) => {
      try {
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

  app.delete(
    '/api/sync',
    // needsAuthorization(['admin']),
    async (req, res, next) => {
      try {
        await models[req.body.namespace].delete(req.body.data);
        if (req.body.namespace === 'entities') {
          await search.delete({ _id: req.body.data._id });
        }
        res.json('ok');
      } catch (e) {
        next(e);
      }
    }
  );
};
