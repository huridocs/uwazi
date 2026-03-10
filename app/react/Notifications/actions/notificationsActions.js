import * as actions from 'app/Notifications/actions/actionTypes';
import ID from 'shared/uniqueID';

const NOTIFICATION_DELAY = process.env.NOTIFICATION_DELAY || 6000;

export function removeNotification(id) {
  return {
    type: actions.REMOVE_NOTIFICATION,
    id,
  };
}

export function notify(message, type, delay = NOTIFICATION_DELAY) {
  return dispatch => {
    const id = ID();
    dispatch({ type: actions.NOTIFY, notification: { message, type, id } });
    if (delay) {
      setTimeout(() => {
        dispatch(removeNotification(id));
      }, delay);
    }
    return id;
  };
}
