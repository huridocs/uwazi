import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';

import templates from '~/Templates/reducers/templatesReducer';
import template from '~/Templates/reducers/templateReducer';
import templateUI from '~/Templates/reducers/uiReducer';
import {reducer as notificationsReducer} from '~/Notifications';

import thesauri from '~/Thesauris/reducers/thesauriReducer';
import thesauris from '~/Thesauris/reducers/thesaurisReducer';

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
