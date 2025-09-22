import * as types from 'app/RelationTypes/actions/actionTypes';
import api from 'app/RelationTypes/RelationTypesAPI';
import { actions } from '../../BasicReducer/index.js';
import { notificationActions } from 'app/Notifications';
import { t } from '../../I18N/index.js';
import { RequestParams } from 'app/utils/RequestParams';

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
