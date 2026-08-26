import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { GetSettingsController } from './GetSettingsController.js';
import { SaveSettingsController } from './SaveSettingsController.js';
import { GetSettingsLinksController } from './GetSettingsLinksController.js';
import { SaveSettingsLinksController } from './SaveSettingsLinksController.js';

const settingsRoutes = (app: Application) => {
  app.get('/api/settings', GetSettingsController.createHandler());
  app.post('/api/settings', needsAuthorization(), SaveSettingsController.createHandler());
  app.get('/api/settings/links', GetSettingsLinksController.createHandler());
  app.post('/api/settings/links', needsAuthorization(), SaveSettingsLinksController.createHandler());
};

export { settingsRoutes };
