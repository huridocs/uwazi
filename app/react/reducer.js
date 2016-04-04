import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';

import templates from 'app/Templates/reducers/templatesReducer';
import template from 'app/Templates/reducers/templateReducer';
import templateUI from 'app/Templates/reducers/uiReducer';
import {reducer as notificationsReducer} from 'app/Notifications';

import thesauri from 'app/Thesauris/reducers/thesauriReducer';
import thesauris from 'app/Thesauris/reducers/thesaurisReducer';

export default combineReducers({
  notifications: notificationsReducer,
  form: formReducer,
  template: combineReducers({
    data: template,
    uiState: templateUI
  }),
  thesauri: thesauri,
  thesauris,
  templates
});
