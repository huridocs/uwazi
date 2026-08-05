import { tenants } from '#api/tenants/index.js';
import type { Settings } from '#shared/types/settingsType.js';
import { omitInlineCustomization } from '#shared/settings/omitInlineCustomization.js';

/** Fields safe to expose to unauthenticated / non-admin users. */
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

/**
 * Shape settings for SSR hydration the same way GET /api/settings does:
 * admins get the full document; everyone else gets the public whitelist.
 * Preserve `features` already merged with client feature flags for FeatureToggle.
 */
const shapeSettingsForSSR = (
  settingsData: Settings & { features?: Settings['features']; themeCustomization?: boolean },
  user?: { role?: string } | null
) => {
  if (user?.role === 'admin') {
    return {
      ...settingsData,
      ...getPublicSettingsPayload(settingsData),
      features: settingsData.features,
    };
  }

  return {
    ...getPublicSettingsPayload(settingsData),
    features: settingsData.features,
  };
};

export {
  PUBLIC_ALLOWED_FIELDS,
  pickPublicFields,
  getPublicSettingsPayload,
  shapeSettingsForSSR,
  omitInlineCustomization,
};
