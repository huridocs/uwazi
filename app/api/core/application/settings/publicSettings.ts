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

/** Admin UI: public ∪ non-secret admin fields. Not “everything minus sync”. Never `sync` / `evidencesVault`. */
const ADMIN_ALLOWED_FIELDS: (keyof Settings)[] = [
  ...PUBLIC_ALLOWED_FIELDS,
  'contactEmail',
  'senderEmail',
  'openPublicEndpoint',
  'mailerConfig',
  'publicFormDestination',
  'features',
  'filterUnauthorizedRelated',
];

const pickFields =
  (allowed: (keyof Settings)[]) =>
  (settingsData: Settings): Partial<Settings> => {
    const picked: Partial<Settings> = {};
    allowed.forEach(field => {
      if (field in settingsData) {
        (picked as Record<string, unknown>)[field] = settingsData[field];
      }
    });
    return picked;
  };

const pickPublicFields = pickFields(PUBLIC_ALLOWED_FIELDS);
const pickAdminFields = pickFields(ADMIN_ALLOWED_FIELDS);

const getPublicSettingsPayload = (settingsData: Settings) => ({
  ...pickPublicFields(settingsData),
  themeCustomization: tenants.current().featureFlags?.themeCustomization ?? false,
});

/**
 * Shape already-allowlisted settings for SSR hydration.
 * `features` must already be the audience-safe set (admin allowlist or tenant flags only).
 */
const shapeSettingsForSSR = (
  settingsData: Settings & { features?: Settings['features']; themeCustomization?: boolean },
  user?: { role?: string } | null
) => {
  if (user?.role === 'admin') {
    return {
      ...pickAdminFields(settingsData),
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
  ADMIN_ALLOWED_FIELDS,
  pickPublicFields,
  pickAdminFields,
  getPublicSettingsPayload,
  shapeSettingsForSSR,
  omitInlineCustomization,
};
