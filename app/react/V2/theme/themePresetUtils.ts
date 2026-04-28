import type { ThemePresetId } from '#V2/theme/themes.js';

function getPresetValue<T>(presetId: ThemePresetId, legacy: T, current: T): T {
  return presetId === 'legacy' ? legacy : current;
}

export { getPresetValue };
