import needsAuthorization from '../auth/authMiddleware';
import models from './models';

export default (app) => {
  app.post(
    '/api/sync',
    needsAuthorization(['admin']),
    async (req, res, next) => {
      try {
        await models[req.body.namespace].save(req.body.data);
        res.json('ok');
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete(
    '/api/sync',
    needsAuthorization(['admin']),
    async (req, res, next) => {
      try {
        await models[req.body.namespace].delete(req.body.data);
        res.json('ok');
      } catch (e) {
        next(e);
      }
    }
  );
};
