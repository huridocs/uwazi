import { SettingsAPI } from '#app/Settings/SettingsAPI.js';

import { saveSettings } from '../settingsActions.js';

describe('saveSettings', () => {
  let dispatch;
  beforeEach(() => {
    spyOn(SettingsAPI, 'save').and.callFake(async () => Promise.resolve());
    dispatch = jasmine.createSpy('dispatch');
  });

  it('should save the settings using the api', () => {
    void saveSettings({ customSettings: 'anything' })(dispatch);

    expect(SettingsAPI.save).toHaveBeenCalledWith({
      data: { customSettings: 'anything' },
      headers: {},
    });
  });

  it('should call notify after saving settings', async () => {
    await saveSettings({ customSettings: 'anything' })(dispatch);
    expect(dispatch).toHaveBeenCalled();
  });
});
