import { combineReducers } from 'redux';
import { createReducer } from '#app/BasicReducer/index.js';
import { modelReducer, formReducer } from 'react-redux-form';

const reducer = combineReducers({
  collection: createReducer('settings/collection', {}),
  stats: createReducer('settings/stats', {}),
  navlinksData: modelReducer('settings.navlinksData', { links: [] }),
  navlinksFormState: formReducer('settings.navlinksData'),
  form: modelReducer('account.form', { username: '', password: '' }),
  formState: formReducer('account.form'),
  settingForm: formReducer('settings.settings'),
  settings: modelReducer('settings.settings', {}),
});

export { reducer };
