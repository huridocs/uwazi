import { getPresetId, getPresetVars, THEME_PRESET_KEY } from './themes.js';
import type { ThemePresetId } from './themes.js';

type ThemeVars = Record<string, string | undefined>;

const CUSTOM_BACKUP_PREFIX = 'backup:';

const isCustomBackupKey = (key: string) => key.startsWith(CUSTOM_BACKUP_PREFIX);

const snapshotCustom = (themeVars: ThemeVars) => {
  const backup: Record<string, string> = {};
  Object.entries(themeVars).forEach(([key, value]) => {
    if (!value || key === THEME_PRESET_KEY || isCustomBackupKey(key)) return;
    backup[`${CUSTOM_BACKUP_PREFIX}${key}`] = value;
  });
  return backup;
};

const keptBackup = (themeVars: ThemeVars) => {
  const backup: Record<string, string> = {};
  Object.entries(themeVars).forEach(([key, value]) => {
    if (value && isCustomBackupKey(key)) backup[key] = value;
  });
  return backup;
};

const restoredCustom = (themeVars: ThemeVars) => {
  const next: Record<string, string> = { [THEME_PRESET_KEY]: 'custom' };
  let found = false;
  Object.entries(themeVars).forEach(([key, value]) => {
    if (!value || !isCustomBackupKey(key)) return;
    next[key.slice(CUSTOM_BACKUP_PREFIX.length)] = value;
    found = true;
  });
  return found ? next : undefined;
};

const restoredCustomWithEdits = (themeVars: ThemeVars): Record<string, string> | undefined => {
  const restored = restoredCustom(themeVars);
  if (!restored) return undefined;
  Object.entries(themeVars).forEach(([key, value]) => {
    if (!value || key === THEME_PRESET_KEY || isCustomBackupKey(key)) return;
    restored[key] = value;
  });
  return restored;
};

const selectThemePreset = (
  themeVars: ThemeVars,
  presetId: ThemePresetId
): Record<string, string> => {
  if (presetId === 'custom') {
    return restoredCustomWithEdits(themeVars) ?? { [THEME_PRESET_KEY]: 'custom' };
  }
  const backup =
    getPresetId(themeVars, true) === 'custom' ? snapshotCustom(themeVars) : keptBackup(themeVars);
  return { ...getPresetVars(presetId), ...backup };
};

const themeVarsForInstanceExport = (themeVars: ThemeVars) =>
  restoredCustomWithEdits(themeVars) ?? themeVars;

export { CUSTOM_BACKUP_PREFIX, isCustomBackupKey, selectThemePreset, themeVarsForInstanceExport };
