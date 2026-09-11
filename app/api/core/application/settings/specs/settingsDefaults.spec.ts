import { applySettingsDefaults, DEFAULT_MAP_STARTING_POINT } from '../settingsDefaults.js';

describe('applySettingsDefaults', () => {
  it('should default mapStartingPoint even when other fields are absent', () => {
    expect(applySettingsDefaults({}).mapStartingPoint).toEqual(DEFAULT_MAP_STARTING_POINT);
  });
});
