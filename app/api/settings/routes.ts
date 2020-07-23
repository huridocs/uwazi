import settings from 'api/settings/settings';
import { Application } from 'express';

import needsAuthorization from '../auth/authMiddleware';

export default (app: Application) => {
  app.post('/api/settings', needsAuthorization(), (req, res, next) => {
    settings
      .save(req.body)
      .then(response => res.json(response))
      .catch(next);
  });

  app.get('/api/settings', (req, res, next) => {
    const select = req.user && req.user.role === 'admin' ? '+publicFormDestination' : {};
    settings
      .get({}, select)
      .then(response => res.json(response))
      .catch(next);
  });
};
