import type { Application } from 'express';
import settings from '#api/settings/settings.js';
import needsAuthorization from '../auth/authMiddleware.js';
import { getPublicSettingsPayload } from './publicSettings.js';

export default (app: Application) => {
  app.get('/api/settings', (req, res, next) => {
    const select = req.user && req.user.role === 'admin' ? '+publicFormDestination' : {};
    settings
      .get({}, select)
      .then(response => {
        const payload =
          req.user?.role === 'admin'
            ? { ...response, ...getPublicSettingsPayload(response) }
            : getPublicSettingsPayload(response);
        res.json(payload);
      })
      .catch(next);
  });

  app.post('/api/settings', needsAuthorization(), (req, res, next) => {
    settings
      .save(req.body)
      .then(response => {
        req.sockets.emitToCurrentTenant('updateSettings', getPublicSettingsPayload(response));
        res.json(response);
      })
      .catch(next);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.get('/api/settings/links', (req, res, next) => {
    settings
      .get()
      .then(response => res.json(response.links))
      .catch(next);
  });

  app.post('/api/settings/links', needsAuthorization(), (req, res, next) => {
    settings
      .save({ links: req.body })
      .then(response => {
        req.sockets.emitToCurrentTenant('updateSettings', getPublicSettingsPayload(response));
        res.json(response);
      })
      .catch(next);
  });
};
