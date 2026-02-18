import { notificationActions } from '#app/Notifications/index.js';
import { t } from '#app/I18N/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { SettingsAPI } from '#app/Settings/SettingsAPI.js';
import { actions } from '#app/BasicReducer/index.js';

const saveSettings = data => dispatch =>
  SettingsAPI.save(new RequestParams(data)).then(newSettings => {
    dispatch(actions.set('settings/collection', newSettings));
    dispatch(notificationActions.notify(t('System', 'Settings updated'), 'success'));
  });

export { saveSettings };
