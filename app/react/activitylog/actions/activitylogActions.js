import { actions } from 'app/BasicReducer';
import api from '../../utils/api';

export function activitylogSearch(query) {
  return dispatch => api.get('activitylog', query)
  .then((response) => {
    dispatch(actions.set('activitylog', response.json));
  });
}
