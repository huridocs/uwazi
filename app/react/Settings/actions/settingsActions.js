import { notificationActions } from '../../Notifications.js';
import { t } from '#app/I18N/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import SettingsAPI from '../../Settings/SettingsAPI.js';
import { actions } from '../../BasicReducer/index.js';

const saveSettings = data => dispatch =>
  SettingsAPI.save(new RequestParams(data)).then(newSettings => {
    dispatch(actions.set('settings/collection', newSettings));
    dispatch(notificationActions.notify(t('System', 'Settings updated'), 'success'));
  });

export default saveSettings;
