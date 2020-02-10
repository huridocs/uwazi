import { notificationActions } from 'app/Notifications';
import { t } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import SettingsAPI from 'app/Settings/SettingsAPI';

const saveSettings = data => dispatch =>
  SettingsAPI.save(new RequestParams(data)).then(() => {
    dispatch(notificationActions.notify(t('System', 'Settings updated'), 'success'));
  });

export default saveSettings;
