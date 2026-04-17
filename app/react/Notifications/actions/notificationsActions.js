import uniqueID from '#shared/uniqueID.js';
import * as types from './actionTypes.js';

export function removeNotification(id) {
  return { type: types.REMOVE_NOTIFICATION, id };
}

export function notify(message, type, delay = 1500) {
  return dispatch => {
    const id = uniqueID();
    dispatch({ type: types.NOTIFY, notification: { message, type, id } });

    if (delay !== false) {
      setTimeout(() => dispatch(removeNotification(id)), delay);
    }

    return id;
  };
}
