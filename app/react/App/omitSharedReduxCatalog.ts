/**
 * Shared catalog data is serialized only in `__atomStoreData__`.
 * Strip those keys from the Redux SSR blob so the HTML payload is not duplicated.
 * SSR still keeps a full in-memory Redux store for legacy connected components.
 */
const SHARED_CATALOG_KEYS = [
  'templates',
  'thesauris',
  'translations',
  'relationTypes',
  'user',
  'locale',
] as const;

type ReduxSettingsSlice = {
  collection?: unknown;
  [key: string]: unknown;
};

type ReduxDataWithSharedCatalog = {
  settings?: ReduxSettingsSlice;
  [key: string]: unknown;
};

const omitSharedReduxCatalog = <T extends ReduxDataWithSharedCatalog>(
  reduxData: T
): Omit<T, (typeof SHARED_CATALOG_KEYS)[number]> & { settings?: ReduxSettingsSlice } => {
  const stripped: Record<string, unknown> = { ...reduxData };

  SHARED_CATALOG_KEYS.forEach(key => {
    delete stripped[key];
  });

  if (stripped.settings && typeof stripped.settings === 'object') {
    const { collection: _collection, ...settingsWithoutCollection } =
      stripped.settings as ReduxSettingsSlice;
    stripped.settings =
      Object.keys(settingsWithoutCollection).length > 0 ? settingsWithoutCollection : undefined;
    if (stripped.settings === undefined) {
      delete stripped.settings;
    }
  }

  return stripped as Omit<T, (typeof SHARED_CATALOG_KEYS)[number]> & {
    settings?: ReduxSettingsSlice;
  };
};

export { omitSharedReduxCatalog, SHARED_CATALOG_KEYS };
