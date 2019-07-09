import * as types from 'app/RelationTypes/actions/actionTypes';
import api from 'app/RelationTypes/RelationTypesAPI';
import { notificationActions } from 'app/Notifications';
import { t } from 'app/I18N';


export function saveRelationType(relationType) {
  return dispatch => api.save(relationType)
  .then(() => {
    dispatch({ type: types.RELATION_TYPE_SAVED });
    dispatch(notificationActions.notify(t('System', 'RelationType saved', null, false), 'success'));
  });
}

export function resetRelationType() {
  return { type: types.RESET_RELATION_TYPE };
}
