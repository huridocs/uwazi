import type { Application } from 'express';
import settings from '#api/settings/settings.js';
import { tenants } from '#api/tenants/index.js';
import type { Settings } from '#shared/types/settingsType.js';
import needsAuthorization from '../auth/authMiddleware.js';

// Fields safe to expose to unauthenticated users
const PUBLIC_ALLOWED_FIELDS: (keyof Settings)[] = [
  '_id',
  'project',
  'site_name',
  'favicon',
  'site_logo',
  'themeAssets',
  'themeVars',
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
  'allowedPublicTemplates',
  'custom',
  'customCSS',
  'allowcustomJS',
  'customJS',
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

const getPublicSettingsPayload = (settingsData: Settings) => ({
  ...pickPublicFields(settingsData),
  themeCustomization: tenants.current().featureFlags?.themeCustomization ?? false,
});

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
