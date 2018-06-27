import SettingsAPI from 'app/Settings/SettingsAPI';

import saveSettings from '../settingsActions';

describe('saveSettings', () => {
  let dispatch;
  beforeEach(() => {
    spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
    dispatch = jasmine.createSpy('dispatch');
  });

  it('should save the settings using the api', () => {
    saveSettings({ customSettings: 'anything' })(dispatch);

    expect(SettingsAPI.save).toHaveBeenCalledWith({ customSettings: 'anything' });
  });

  it('should call notify after saving settings', (done) => {
    saveSettings({ customSettings: 'anything' })(dispatch)
    .then(() => {
      expect(dispatch).toHaveBeenCalled();
      done();
    });
  });
});
