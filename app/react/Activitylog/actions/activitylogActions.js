import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';
import api from '../../utils/api';

export function activitylogSearch(query) {
  return dispatch => api.get('activitylog', new RequestParams(query))
  .then((response) => {
    dispatch(actions.set('activitylog/search', response.json));
    dispatch(actions.set('activitylog/list', response.json.rows));
  });
}

// TEST!!!!
export function activitylogSearchMore(query) {
  return dispatch => api.get('activitylog', new RequestParams(query))
  .then((response) => {
    dispatch(actions.set('activitylog/search', response.json));
    dispatch(actions.concat('activitylog/list', response.json.rows));
  });
}
