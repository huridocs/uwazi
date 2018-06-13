import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify } from 'app/Notifications';
import { t } from 'app/I18N';

const saveSettings = (data) => {
  const settings = Object.assign({}, data);
  settings.customCSS = data.settings.customCSS;
  SettingsAPI.save(settings)
  .then((result) => {
    notify(t('System', 'Settings updated'), 'success');
    // this.props.setSettings(result);
    console.log(result);
  });
};

export {
  saveSettings
};
