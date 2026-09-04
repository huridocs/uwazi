import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { toPersistableSettingsFields } from '../../settings/persistableSettingsFields.js';

const COLUMN_FIELDS = {
  languages: 'languages',
  links: 'links',
  filters: 'filters',
  features: 'features',
  themeVars: 'theme_vars',
  themeAssets: 'theme_assets',
  site_name: 'site_name',
  customCSS: 'custom_css',
  customJS: 'custom_js',
  sync: 'sync',
  private: 'private',
  newNameGeneration: 'new_name_generation',
  openPublicEndpoint: 'open_public_endpoint',
  allowedPublicTemplates: 'allowed_public_templates',
  publicFormDestination: 'public_form_destination',
  ocrServiceEnabled: 'ocr_service_enabled',
  filterUnauthorizedRelated: 'filter_unauthorized_related',
  project: 'project',
  custom: 'custom',
} as const;

const GROUP_FIELDS = {
  mail: ['mailerConfig', 'contactEmail', 'senderEmail'],
  analytics: ['analyticsTrackingId', 'matomoConfig'],
  map: ['mapApiKey', 'mapLayers', 'mapStartingPoint', 'tilesProvider'],
  branding: ['site_logo', 'favicon'],
  site_preferences: ['home_page', 'defaultLibraryView', 'allowcustomJS', 'cookiepolicy'],
} as const;

const COLUMN_BY_SETTINGS_KEY = Object.fromEntries(
  Object.entries(COLUMN_FIELDS).map(([settingsKey, column]) => [settingsKey, column])
) as Record<string, string>;

const SETTINGS_KEY_BY_COLUMN = Object.fromEntries(
  Object.entries(COLUMN_FIELDS).map(([settingsKey, column]) => [column, settingsKey])
) as Record<string, keyof SettingsType>;

const GROUP_KEYS = new Set<string>(Object.values(GROUP_FIELDS).flat());

type GroupName = keyof typeof GROUP_FIELDS;

type SettingsRow = {
  _id: string;
  languages?: SettingsType['languages'] | null;
  links?: SettingsType['links'] | null;
  filters?: SettingsType['filters'] | null;
  features?: SettingsType['features'] | null;
  theme_vars?: SettingsType['themeVars'] | null;
  theme_assets?: SettingsType['themeAssets'] | null;
  site_name?: string | null;
  custom_css?: string | null;
  custom_js?: string | null;
  sync?: SettingsType['sync'] | null;
  private?: boolean | null;
  new_name_generation?: boolean | null;
  open_public_endpoint?: boolean | null;
  allowed_public_templates?: SettingsType['allowedPublicTemplates'] | null;
  public_form_destination?: string | null;
  ocr_service_enabled?: boolean | null;
  filter_unauthorized_related?: boolean | null;
  project?: string | null;
  custom?: SettingsType['custom'] | null;
  mail?: Record<string, unknown> | null;
  analytics?: Record<string, unknown> | null;
  map?: Record<string, unknown> | null;
  branding?: Record<string, unknown> | null;
  site_preferences?: Record<string, unknown> | null;
  extras?: Record<string, unknown> | null;
};

const asIdString = (id: SettingsType['_id']): string => {
  if (id == null) {
    return '';
  }
  if (typeof id === 'string') {
    return id;
  }
  if (typeof id === 'object' && 'toHexString' in id && typeof id.toHexString === 'function') {
    return id.toHexString();
  }
  return String(id);
};

const pickDefined = (source: Record<string, unknown>, keys: readonly string[]) => {
  const picked: Record<string, unknown> = {};
  keys.forEach(key => {
    if (source[key] !== undefined) {
      picked[key] = source[key];
    }
  });
  return Object.keys(picked).length ? picked : undefined;
};

export class PostgresSettingsMapper {
  static toRow(settings: SettingsType, generateId: () => string): SettingsRow {
    const source = {
      ...(toPersistableSettingsFields(settings, generateId) as SettingsType &
        Record<string, unknown>),
    };
    delete source.__v;
    delete source.tenant_id;

    const row: SettingsRow = {
      _id: asIdString(source._id),
      extras: {},
    };
    delete source._id;

    (Object.keys(COLUMN_FIELDS) as (keyof typeof COLUMN_FIELDS)[]).forEach(settingsKey => {
      if (source[settingsKey] !== undefined) {
        (row as Record<string, unknown>)[COLUMN_FIELDS[settingsKey]] = source[settingsKey];
        delete source[settingsKey];
      }
    });

    (Object.keys(GROUP_FIELDS) as GroupName[]).forEach(group => {
      const picked = pickDefined(source, GROUP_FIELDS[group]);
      if (picked) {
        row[group] = picked;
        GROUP_FIELDS[group].forEach(key => {
          delete source[key];
        });
      }
    });

    row.extras = { ...source };
    return row;
  }

  static toSettings(row: SettingsRow): SettingsType {
    const settings: Record<string, unknown> = {};
    if (row._id) {
      settings._id = row._id;
    }

    Object.entries(SETTINGS_KEY_BY_COLUMN).forEach(([column, settingsKey]) => {
      const value = (row as Record<string, unknown>)[column];
      if (value !== undefined) {
        settings[settingsKey] = value;
      }
    });

    (Object.keys(GROUP_FIELDS) as GroupName[]).forEach(group => {
      const value = row[group];
      if (value && typeof value === 'object') {
        Object.assign(settings, value);
      }
    });

    if (row.extras && typeof row.extras === 'object') {
      Object.assign(settings, row.extras);
    }

    return settings as SettingsType;
  }

  static columnForField(field: keyof SettingsType): string | undefined {
    if (field === '_id') {
      return '_id';
    }
    if (COLUMN_BY_SETTINGS_KEY[field]) {
      return COLUMN_BY_SETTINGS_KEY[field];
    }
    if (GROUP_KEYS.has(field)) {
      const group = (Object.keys(GROUP_FIELDS) as GroupName[]).find(name =>
        (GROUP_FIELDS[name] as readonly string[]).includes(field)
      );
      return group;
    }
    return 'extras';
  }
}

export type { SettingsRow };
