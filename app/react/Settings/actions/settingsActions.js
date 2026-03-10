import { notificationActions } from 'app/Notifications';
import { t } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { actions } from 'app/BasicReducer';

const saveSettings = data => dispatch =>
  SettingsAPI.save(new RequestParams(data)).then(newSettings => {
    dispatch(actions.set('settings/collection', newSettings));
    dispatch(notificationActions.notify(t('System', 'Settings updated'), 'success'));
  });

export default saveSettings;
