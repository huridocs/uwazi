import Immutable from 'immutable';

import * as actions from 'app/Notifications/actions/actionTypes';

const initialState = [];

export default function notificationsReducer(state = initialState, action = {}) {
  if (action.type === actions.NOTIFY) {
    return state.push(Immutable.fromJS(action.notification));
  }

  if (action.type === actions.REMOVE_NOTIFICATION) {
    return state.filter((notification) => notification.get('id') !== action.id);
  }

  return Immutable.fromJS(state);
}
