import settings from '#api/settings/settings.js';
import type { Application } from 'express';
import type { Settings } from '#shared/types/settingsType.js';
import needsAuthorization from '../auth/authMiddleware.js';

// Fields safe to expose to unauthenticated users
const PUBLIC_ALLOWED_FIELDS: (keyof Settings)[] = [
  '_id',
  'project',
  'site_name',
  'favicon',
  'home_page',
  'defaultLibraryView',
  'private',
  'cookiepolicy',
  'languages',
  'filters',
  'links',
  'dateFormat',
  'analyticsTrackingId',
  'matomoConfig',
  'mapApiKey',
  'mapLayers',
  'mapStartingPoint',
  'tilesProvider',
  'newNameGeneration',
  'ocrServiceEnabled',
  'openPublicEndpoint',
  'allowedPublicTemplates',
  'custom',
  'customCSS',
];

const pickPublicFields = (settingsData: Settings): Partial<Settings> => {
  const publicSettings: Partial<Settings> = {};
  PUBLIC_ALLOWED_FIELDS.forEach(field => {
    if (field in settingsData) {
      (publicSettings as Record<string, unknown>)[field] = settingsData[field];
    }
  });
  return publicSettings;
};

export default (app: Application) => {
  app.get('/api/settings', (req, res, next) => {
    const select = req.user && req.user.role === 'admin' ? '+publicFormDestination' : {};
    settings
      .get({}, select)
      .then(response => {
        if (req.user?.role === 'admin' || req.user?.role === 'editor') {
          res.json(response);
        } else if (req.user?.role) {
          const { features, ...partialSettings } = response;
          res.json(partialSettings);
        } else {
          res.json(pickPublicFields(response));
        }
      })
      .catch(next);
  });

  app.post('/api/settings', needsAuthorization(), (req, res, next) => {
    settings
      .save(req.body)
      .then(response => res.json(response))
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
      .then(response => res.json(response))
      .catch(next);
  });
};
