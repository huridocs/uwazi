import * as types from 'app/RelationTypes/actions/actionTypes';
import api from 'app/RelationTypes/RelationTypesAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import {t} from 'app/I18N';


export function saveRelationType(relationType) {
  return function (dispatch) {
    return api.save(relationType).then(() => {
      dispatch({type: types.RELATION_TYPE_SAVED});
      notifications.notify(t('System', 'RelationType saved'), 'success')(dispatch);
    });
  };
}

export function resetRelationType() {
  return {type: types.RESET_RELATION_TYPE};
}
