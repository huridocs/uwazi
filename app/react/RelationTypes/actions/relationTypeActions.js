import * as types from '../../RelationTypes/actions/actionTypes.js';
import api from '../../RelationTypes/RelationTypesAPI.js';
import { actions } from '../../BasicReducer/index.js';
import { notificationActions } from '../../Notifications.js';
import { t } from 'app/I18N/index.js';
import { RequestParams } from 'app/utils/RequestParams.js';

export function saveRelationType(relationType) {
  return dispatch =>
    api.save(new RequestParams(relationType)).then(response => {
      dispatch({ type: types.RELATION_TYPE_SAVED });
      dispatch(actions.push('relationTypes', response));
      dispatch(
        notificationActions.notify(t('System', 'RelationType saved', null, false), 'success')
      );
    });
}

export function resetRelationType() {
  return { type: types.RESET_RELATION_TYPE };
}
