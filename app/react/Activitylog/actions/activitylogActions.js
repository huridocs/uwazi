import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';
import api from '../../utils/api';

const activitylogSearchBase = (query, append = false) => {
  const method = append ? 'concat' : 'set';

  return dispatch =>
    api.get('activitylog', new RequestParams(query)).then(response => {
      dispatch(actions.set('activitylog/search', response.json));
      dispatch(actions[method]('activitylog/list', response.json.rows));
    });
};

export function activitylogSearch(query) {
  return activitylogSearchBase(query);
}

export function activitylogSearchMore(query) {
  return activitylogSearchBase(query, true);
}
