import isEqual from 'lodash/isEqual.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';

/**
 * What a settings change touched: the top-level fields that differ and, when any feature was
 * switched on or off, which ones. Feature configuration itself is never carried — it can hold
 * service urls and credentials, and this travels in job params.
 */
type SettingsChanges = {
  keys: string[];
  features?: { enabled: string[]; disabled: string[] };
};

const UNTRACKED_KEYS = new Set(['_id', '__v']);

class SettingsDiff {
  static between(before: SettingsType, after: SettingsType): SettingsChanges {
    const keys = SettingsDiff.union(before, after).filter(
      key =>
        !UNTRACKED_KEYS.has(key) &&
        !isEqual(before[key as keyof SettingsType], after[key as keyof SettingsType])
    );
    const features = SettingsDiff.switchedFeatures(before.features ?? {}, after.features ?? {});

    return { keys, ...(features && { features }) };
  }

  /** A feature is on when it is present and truthy, as `readFeature` reads it. */
  private static switchedFeatures(before: object, after: object) {
    const isOn = (features: object, name: string) =>
      Boolean(features[name as keyof typeof features]);
    const names = SettingsDiff.union(before, after);

    const enabled = names.filter(name => !isOn(before, name) && isOn(after, name));
    const disabled = names.filter(name => isOn(before, name) && !isOn(after, name));

    return enabled.length || disabled.length ? { enabled, disabled } : undefined;
  }

  private static union(a: object, b: object): string[] {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  }
}

export { SettingsDiff };
export type { SettingsChanges };
