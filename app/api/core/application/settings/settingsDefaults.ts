import { LatLonSchema } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';

const DEFAULT_MAP_STARTING_POINT: LatLonSchema[] = [{ lon: 6, lat: 46 }];

const HIDDEN_HTTP_FIELDS = ['sync', 'evidencesVault', 'publicFormDestination'] as const;

const applySettingsDefaults = (settings: Settings): Settings => {
  if (!Object.keys(settings).length) {
    return {};
  }

  return {
    ...settings,
    mapStartingPoint:
      settings.mapStartingPoint && settings.mapStartingPoint.length
        ? settings.mapStartingPoint
        : DEFAULT_MAP_STARTING_POINT,
  };
};

const omitHiddenSettingsFields = (settings: Settings): Settings => {
  const next = { ...settings } as Settings & { evidencesVault?: unknown };
  delete next.sync;
  delete next.evidencesVault;
  delete next.publicFormDestination;
  return next;
};

export {
  DEFAULT_MAP_STARTING_POINT,
  HIDDEN_HTTP_FIELDS,
  applySettingsDefaults,
  omitHiddenSettingsFields,
};
