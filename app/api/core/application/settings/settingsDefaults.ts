import { LatLonSchema } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';

const DEFAULT_MAP_STARTING_POINT: LatLonSchema[] = [{ lon: 6, lat: 46 }];

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

export { DEFAULT_MAP_STARTING_POINT, applySettingsDefaults };
