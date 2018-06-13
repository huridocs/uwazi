import saveSettings from '../settingsActions';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify } from 'app/Notifications';

describe('saveSettings', () => {
  it('should save the settings using the api', () => {
    spyOn(SettingsAPI, 'save');
    let dispatch = jasmine.createSpy('dispatch');
    saveSettings({ customSettings: 'anything' })(dispatch);

    expect(SettingsAPI.save).toHaveBeenCalledWith({ customSettings: 'anything' });
  });

  it('should call notify after saving settings', () => {
    spyOn(SettingsAPI, 'save');

    let dispatch = jasmine.createSpy('dispatch');
    saveSettings({ customSettings: 'anything' })(dispatch);

    expect(dispatch).toHaveBeenCalled();
  });
});
