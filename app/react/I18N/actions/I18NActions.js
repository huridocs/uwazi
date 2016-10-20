import {actions as formActions} from 'react-redux-form';

import t from '../t';
import I18NApi from '../I18NApi';
import * as notifications from 'app/Notifications/actions/notificationsActions';

export function saveTranslations(translations) {
  return function (dispatch) {
    Promise.all(translations.map((translation) => {
      return I18NApi.save(translation);
    }))
    .then(() => {
      notifications.notify(t('System', 'Translations saved'), 'success')(dispatch);
    });
  };
}

export function editTranslations(translations) {
  return function (dispatch) {
    dispatch(formActions.load('translationsForm', translations));
  };
}
